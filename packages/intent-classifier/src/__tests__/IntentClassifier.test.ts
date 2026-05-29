import { describe, it, expect, vi } from 'vitest';
import { IntentClassifier } from '../IntentClassifier';
import { createIntentStep } from '../createIntentStep';
import { Graph, WorkflowEngine, WorkflowContext } from '@moon-wave/workflow';
import type { LLMProvider, LLMResponse } from '@moon-wave/types';
import type { AgentContext } from '@moon-wave/types';

const agentCtx: AgentContext = { sessionId: 'test-1', env: {} };

function mockProvider(content: string): LLMProvider {
  return {
    chat: vi.fn().mockResolvedValue({ type: 'text', content } satisfies LLMResponse),
    stream: vi.fn(),
  };
}

describe('IntentClassifier', () => {
  it('classifies faq intent', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.9, "chitchat": 0.05, "fallback": 0.05}'),
      logger: vi.fn(),
    });
    const result = await classifier.classify('What are your business hours?');
    expect(result.intent).toBe('faq');
    expect(result.confidence).toBeCloseTo(0.9);
    expect(result.scores.faq).toBeCloseTo(0.9);
  });

  it('classifies chitchat intent', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.05, "chitchat": 0.92, "fallback": 0.03}'),
      logger: vi.fn(),
    });
    const result = await classifier.classify('Cảm ơn bạn nhé!');
    expect(result.intent).toBe('chitchat');
    expect(result.confidence).toBeCloseTo(0.92);
  });

  it('classifies fallback intent', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.1, "chitchat": 0.1, "fallback": 0.8}'),
      logger: vi.fn(),
    });
    const result = await classifier.classify('asdf ??? jjjj');
    expect(result.intent).toBe('fallback');
  });

  it('falls back to fallback on unparseable LLM response', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('I cannot classify this.'),
      logger: vi.fn(),
    });
    const result = await classifier.classify('some input');
    expect(result.intent).toBe('fallback');
    expect(result.scores).toEqual({ faq: 0, chitchat: 0, fallback: 1 });
  });

  it('clamps scores to 0-1 range', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 1.5, "chitchat": -0.2, "fallback": 0.5}'),
      logger: vi.fn(),
    });
    const result = await classifier.classify('test');
    expect(result.scores.faq).toBe(1);
    expect(result.scores.chitchat).toBe(0);
    expect(result.scores.fallback).toBe(0.5);
  });

  it('includes context in classification', async () => {
    const provider = mockProvider('{"faq": 0.8, "chitchat": 0.1, "fallback": 0.1}');
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const result = await classifier.classify('What about delivery?', 'User asked about products');
    expect(result.context).toBe('User asked about products');
    expect((provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0][1].content).toContain(
      'Conversation context:',
    );
  });

  it('calls logger with classification result', async () => {
    const logger = vi.fn();
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.7, "chitchat": 0.2, "fallback": 0.1}'),
      logger,
    });
    await classifier.classify('How do I reset my password?');
    expect(logger).toHaveBeenCalledOnce();
    const logged = logger.mock.calls[0][0];
    expect(logged.intent).toBe('faq');
    expect(logged.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('sets timestamp in ISO format', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.9, "chitchat": 0.05, "fallback": 0.05}'),
      logger: vi.fn(),
    });
    const result = await classifier.classify('Hello');
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});

describe('createIntentStep', () => {
  it('routes to faq step when faq wins', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.85, "chitchat": 0.1, "fallback": 0.05}'),
      logger: vi.fn(),
    });

    const graph = new Graph();
    graph
      .step(createIntentStep(classifier))
      .step({ name: 'faq', execute: vi.fn().mockResolvedValue('faq-handled'), next: () => null })
      .step({
        name: 'chitchat',
        execute: vi.fn().mockResolvedValue('chitchat-handled'),
        next: () => null,
      })
      .step({
        name: 'fallback',
        execute: vi.fn().mockResolvedValue('fallback-handled'),
        next: () => null,
      })
      .start('classify');

    const engine = new WorkflowEngine(graph);
    const result = await engine.run('What are your prices?', agentCtx);
    expect(result.output).toBe('faq-handled');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].name).toBe('classify');
    expect(result.steps[1].name).toBe('faq');
  });

  it('routes to chitchat step when chitchat wins', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.05, "chitchat": 0.9, "fallback": 0.05}'),
      logger: vi.fn(),
    });

    const graph = new Graph();
    graph
      .step(createIntentStep(classifier))
      .step({ name: 'faq', execute: vi.fn().mockResolvedValue('faq'), next: () => null })
      .step({
        name: 'chitchat',
        execute: vi.fn().mockResolvedValue('chitchat-done'),
        next: () => null,
      })
      .step({ name: 'fallback', execute: vi.fn().mockResolvedValue('fallback'), next: () => null })
      .start('classify');

    const engine = new WorkflowEngine(graph);
    const result = await engine.run('Xin chào!', agentCtx);
    expect(result.output).toBe('chitchat-done');
  });

  it('routes to fallback step when fallback wins', async () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{"faq": 0.1, "chitchat": 0.05, "fallback": 0.85}'),
      logger: vi.fn(),
    });

    const graph = new Graph();
    graph
      .step(createIntentStep(classifier))
      .step({ name: 'faq', execute: vi.fn().mockResolvedValue('faq'), next: () => null })
      .step({ name: 'chitchat', execute: vi.fn().mockResolvedValue('chitchat'), next: () => null })
      .step({
        name: 'fallback',
        execute: vi.fn().mockResolvedValue('fallback-done'),
        next: () => null,
      })
      .start('classify');

    const engine = new WorkflowEngine(graph);
    const result = await engine.run('???', agentCtx);
    expect(result.output).toBe('fallback-done');
  });

  it('accepts string input directly', async () => {
    const provider = mockProvider('{"faq": 0.8, "chitchat": 0.1, "fallback": 0.1}');
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const step = createIntentStep(classifier);
    const ctx = new WorkflowContext(agentCtx, 'plain string input');
    const result = await step.execute(ctx);
    expect(result.input).toBe('plain string input');
  });

  it('accepts { message, context } object input', async () => {
    const provider = mockProvider('{"faq": 0.8, "chitchat": 0.1, "fallback": 0.1}');
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const step = createIntentStep(classifier);
    const ctx = new WorkflowContext(agentCtx, {
      message: 'What is the return policy?',
      context: 'User browsing product page',
    });
    const result = await step.execute(ctx);
    expect(result.input).toBe('What is the return policy?');
    expect(result.context).toBe('User browsing product page');
  });

  it('uses agentCtx.metadata.context as fallback context', async () => {
    const provider = mockProvider('{"faq": 0.8, "chitchat": 0.1, "fallback": 0.1}');
    const classifier = new IntentClassifier({ provider, logger: vi.fn() });
    const step = createIntentStep(classifier);
    const ctxWithMeta: AgentContext = {
      sessionId: 'test-2',
      env: {},
      metadata: { context: 'Previous turn: user greeted' },
    };
    const ctx = new WorkflowContext(ctxWithMeta, 'Tell me more');
    const result = await step.execute(ctx);
    expect(result.context).toBe('Previous turn: user greeted');
  });

  it('supports custom step name', () => {
    const classifier = new IntentClassifier({
      provider: mockProvider('{}'),
      logger: vi.fn(),
    });
    const step = createIntentStep(classifier, 'intent_router');
    expect(step.name).toBe('intent_router');
  });
});
