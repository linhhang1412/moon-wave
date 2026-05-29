import { IntentClassifier } from './IntentClassifier';
import type { IntentClassificationResult, IntentScores, IntentType } from './types';

export interface IntentEvalCase {
  name: string;
  input: string;
  expectedIntent: IntentType;
  context?: string;
}

export interface IntentEvalMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface IntentEvalCaseResult {
  name: string;
  input: string;
  expectedIntent: IntentType;
  actualIntent: IntentType;
  confidence: number;
  scores: IntentScores;
  passed: boolean;
  durationMs: number;
}

export interface IntentEvalReport {
  accuracy: number;
  total: number;
  correct: number;
  byIntent: Record<IntentType, IntentEvalMetrics>;
  confusionMatrix: Record<IntentType, Record<IntentType, number>>;
  cases: IntentEvalCaseResult[];
  totalMs: number;
}

const INTENTS: IntentType[] = ['faq', 'chitchat', 'fallback'];

export class IntentEvalSuite {
  constructor(
    private classifier: IntentClassifier,
    private cases: IntentEvalCase[],
  ) {}

  async run(
    options: { concurrency?: number; print?: boolean } = {},
  ): Promise<IntentEvalReport> {
    const { concurrency = 1, print = true } = options;
    const startTime = Date.now();

    const runCase = async (c: IntentEvalCase): Promise<IntentEvalCaseResult> => {
      const t0 = Date.now();
      let result: IntentClassificationResult;
      try {
        result = await this.classifier.classify(c.input, c.context);
      } catch (err) {
        result = {
          intent: 'fallback',
          scores: { faq: 0, chitchat: 0, fallback: 1 },
          confidence: 1,
          input: c.input,
          timestamp: new Date().toISOString(),
        };
        void err;
      }
      return {
        name: c.name,
        input: c.input,
        expectedIntent: c.expectedIntent,
        actualIntent: result.intent,
        confidence: result.confidence,
        scores: result.scores,
        passed: result.intent === c.expectedIntent,
        durationMs: Date.now() - t0,
      };
    };

    let caseResults: IntentEvalCaseResult[];
    if (concurrency <= 1) {
      caseResults = [];
      for (const c of this.cases) caseResults.push(await runCase(c));
    } else {
      caseResults = [];
      for (let i = 0; i < this.cases.length; i += concurrency) {
        const batch = this.cases.slice(i, i + concurrency);
        caseResults.push(...(await Promise.all(batch.map(runCase))));
      }
    }

    const report = buildReport(caseResults, Date.now() - startTime);
    if (print) printReport(report);
    return report;
  }
}

function buildReport(
  cases: IntentEvalCaseResult[],
  totalMs: number,
): IntentEvalReport {
  const correct = cases.filter((c) => c.passed).length;

  // Build confusion matrix: confusionMatrix[expected][actual]
  const confusionMatrix = Object.fromEntries(
    INTENTS.map((i) => [i, Object.fromEntries(INTENTS.map((j) => [j, 0]))]),
  ) as Record<IntentType, Record<IntentType, number>>;

  for (const c of cases) {
    confusionMatrix[c.expectedIntent][c.actualIntent]++;
  }

  const byIntent = Object.fromEntries(
    INTENTS.map((intent) => {
      const tp = confusionMatrix[intent][intent];
      const fp = INTENTS.filter((i) => i !== intent).reduce(
        (sum, i) => sum + confusionMatrix[i][intent],
        0,
      );
      const fn = INTENTS.filter((j) => j !== intent).reduce(
        (sum, j) => sum + confusionMatrix[intent][j],
        0,
      );
      const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
      const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
      const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
      const support = cases.filter((c) => c.expectedIntent === intent).length;
      return [intent, { precision, recall, f1, support }];
    }),
  ) as Record<IntentType, IntentEvalMetrics>;

  return {
    accuracy: cases.length === 0 ? 0 : correct / cases.length,
    total: cases.length,
    correct,
    byIntent,
    confusionMatrix,
    cases,
    totalMs,
  };
}

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const BOLD = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;

function printReport(report: IntentEvalReport): void {
  console.log('');
  console.log(BOLD('Intent Classifier Eval'));
  console.log('─'.repeat(56));

  for (const c of report.cases) {
    const icon = c.passed ? PASS : FAIL;
    const dur = DIM(`${c.durationMs}ms`);
    const label = c.passed
      ? `${c.actualIntent}`
      : `${c.actualIntent} (expected ${c.expectedIntent})`;
    console.log(`  ${icon} ${c.name} → ${label} ${dur}`);
  }

  console.log('─'.repeat(56));

  // Per-class metrics table
  console.log(BOLD('  Per-class metrics:'));
  for (const intent of INTENTS) {
    const m = report.byIntent[intent];
    console.log(
      `    ${intent.padEnd(9)} precision=${pct(m.precision)} recall=${pct(m.recall)} f1=${pct(m.f1)} support=${m.support}`,
    );
  }

  console.log('');
  console.log(BOLD('  Confusion matrix (row=expected, col=actual):'));
  const header = `${''.padEnd(11)}${INTENTS.map((i) => i.padEnd(10)).join('')}`;
  console.log(`  ${header}`);
  for (const exp of INTENTS) {
    const row = INTENTS.map((act) => String(report.confusionMatrix[exp][act]).padEnd(10)).join('');
    console.log(`  ${exp.padEnd(11)}${row}`);
  }

  console.log('─'.repeat(56));
  const rate = Math.round(report.accuracy * 100);
  const summary = `${report.correct}/${report.total} correct (${rate}%) ${DIM(`in ${report.totalMs}ms`)}`;
  console.log(report.correct === report.total ? `${PASS} ${BOLD(summary)}` : `${FAIL} ${BOLD(summary)}`);
  console.log('');
}

function pct(n: number): string {
  return `${Math.round(n * 100).toString().padStart(3)}%`;
}
