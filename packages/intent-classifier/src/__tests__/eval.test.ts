import { describe, it, expect, vi } from 'vitest';
import { IntentClassifier } from '../IntentClassifier';
import { IntentEvalSuite } from '../eval';
import type { IntentEvalCase } from '../eval';
import type { LLMProvider, LLMResponse } from '@moon-wave/types';
import type { IntentType } from '../types';

/** Provider that returns the correct scores for a pre-defined set of labeled inputs */
function createPerfectProvider(
  cases: IntentEvalCase[],
): LLMProvider {
  return {
    chat: vi.fn(async (messages) => {
      const userMsg = messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
      const inputMatch = userMsg.match(/^User message: ([\s\S]+?)(\nConversation context:|$)/);
      const input = (inputMatch?.[1] ?? '').trim();
      const found = cases.find((c) => c.input === input);
      const intent: IntentType = found?.expectedIntent ?? 'fallback';
      const scores = {
        faq: intent === 'faq' ? 0.92 : 0.04,
        chitchat: intent === 'chitchat' ? 0.92 : 0.04,
        fallback: intent === 'fallback' ? 0.92 : 0.04,
      };
      return { type: 'text', content: JSON.stringify(scores) } satisfies LLMResponse;
    }),
    stream: vi.fn(),
  };
}

const MINI_DATASET: IntentEvalCase[] = [
  { name: 'faq-1', input: 'What are your hours?', expectedIntent: 'faq' },
  { name: 'faq-2', input: 'How do I return an item?', expectedIntent: 'faq' },
  { name: 'chitchat-1', input: 'Hello!', expectedIntent: 'chitchat' },
  { name: 'chitchat-2', input: 'Thank you!', expectedIntent: 'chitchat' },
  { name: 'fallback-1', input: 'asdf ???', expectedIntent: 'fallback' },
  { name: 'fallback-2', input: '...', expectedIntent: 'fallback' },
];

describe('IntentEvalSuite', () => {
  it('produces perfect accuracy when provider returns correct scores', async () => {
    const provider = createPerfectProvider(MINI_DATASET);
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    expect(report.accuracy).toBe(1);
    expect(report.total).toBe(6);
    expect(report.correct).toBe(6);
  });

  it('computes per-class precision, recall, and F1 correctly for perfect classifier', async () => {
    const provider = createPerfectProvider(MINI_DATASET);
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    for (const intent of ['faq', 'chitchat', 'fallback'] as const) {
      expect(report.byIntent[intent].precision).toBeCloseTo(1);
      expect(report.byIntent[intent].recall).toBeCloseTo(1);
      expect(report.byIntent[intent].f1).toBeCloseTo(1);
      expect(report.byIntent[intent].support).toBe(2);
    }
  });

  it('records confusionMatrix correctly for a perfect run', async () => {
    const provider = createPerfectProvider(MINI_DATASET);
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    for (const intent of ['faq', 'chitchat', 'fallback'] as const) {
      expect(report.confusionMatrix[intent][intent]).toBe(2);
      for (const other of ['faq', 'chitchat', 'fallback'] as const) {
        if (other !== intent) expect(report.confusionMatrix[intent][other]).toBe(0);
      }
    }
  });

  it('correctly measures imperfect accuracy when one case is misclassified', async () => {
    // faq-1 is misclassified as chitchat; all others return the correct intent
    const provider: LLMProvider = {
      chat: vi.fn(async (messages) => {
        const userMsg = messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
        let scores: { faq: number; chitchat: number; fallback: number };
        if (userMsg.includes('What are your hours')) {
          scores = { faq: 0.1, chitchat: 0.85, fallback: 0.05 }; // intentionally wrong
        } else if (userMsg.includes('How do I return')) {
          scores = { faq: 0.9, chitchat: 0.05, fallback: 0.05 };
        } else if (userMsg.includes('Hello') || userMsg.includes('Thank you')) {
          scores = { faq: 0.05, chitchat: 0.9, fallback: 0.05 };
        } else {
          scores = { faq: 0.05, chitchat: 0.05, fallback: 0.9 };
        }
        return { type: 'text', content: JSON.stringify(scores) } satisfies LLMResponse;
      }),
      stream: vi.fn(),
    };
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    expect(report.correct).toBe(5);
    expect(report.total).toBe(6);
    expect(report.accuracy).toBeCloseTo(5 / 6);
    // faq-1 (expected faq) was predicted chitchat → confusionMatrix[faq][chitchat] = 1
    expect(report.confusionMatrix['faq']['chitchat']).toBe(1);
    expect(report.confusionMatrix['faq']['faq']).toBe(1); // faq-2 correct
  });

  it('computes metrics correctly when all predictions are the same class', async () => {
    // All 6 cases predicted as faq regardless of expected
    // faq:     TP=2, FP=4, FN=0  → precision=2/6≈0.33, recall=2/2=1, F1=0.50
    // chitchat: TP=0, FP=0, FN=2 → precision=0 (no FP, no TP), recall=0, F1=0
    // fallback: TP=0, FP=0, FN=2 → precision=0, recall=0, F1=0
    const provider: LLMProvider = {
      chat: vi.fn().mockResolvedValue({
        type: 'text',
        content: '{"faq": 0.9, "chitchat": 0.05, "fallback": 0.05}',
      } satisfies LLMResponse),
      stream: vi.fn(),
    };
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    // Only 2 faq cases are correct
    expect(report.correct).toBe(2);
    expect(report.byIntent['faq'].precision).toBeCloseTo(2 / 6);
    expect(report.byIntent['faq'].recall).toBeCloseTo(1);
    // chitchat & fallback: no TP, no FP → precision 0; FN=2 → recall 0
    expect(report.byIntent['chitchat'].precision).toBeCloseTo(0);
    expect(report.byIntent['chitchat'].recall).toBeCloseTo(0);
    expect(report.byIntent['chitchat'].f1).toBe(0);
    expect(report.byIntent['fallback'].precision).toBeCloseTo(0);
    expect(report.byIntent['fallback'].recall).toBeCloseTo(0);
    expect(report.byIntent['fallback'].f1).toBe(0);
  });

  it('records durationMs for each case', async () => {
    const provider = createPerfectProvider(MINI_DATASET);
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    for (const c of report.cases) {
      expect(c.durationMs).toBeGreaterThanOrEqual(0);
    }
    expect(report.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('includes per-case result with expectedIntent and actualIntent', async () => {
    const provider = createPerfectProvider(MINI_DATASET);
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false });

    const faqCase = report.cases.find((c) => c.name === 'faq-1');
    expect(faqCase).toBeDefined();
    expect(faqCase?.expectedIntent).toBe('faq');
    expect(faqCase?.actualIntent).toBe('faq');
    expect(faqCase?.passed).toBe(true);
  });

  it('runs concurrently when concurrency > 1', async () => {
    const provider = createPerfectProvider(MINI_DATASET);
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const suite = new IntentEvalSuite(classifier, MINI_DATASET);
    const report = await suite.run({ print: false, concurrency: 3 });

    expect(report.total).toBe(6);
    expect(report.accuracy).toBe(1);
  });
});
