import type { Agent } from '@moon-wave/core';
import type { AgentContext } from '@moon-wave/types';
import type { EvalCase, EvalReport, EvalResult, EvalVerdict } from './types.js';
import { printReport } from './reporter.js';

export class EvalSuite {
  constructor(
    private agent: Agent,
    private cases: EvalCase[],
  ) {}

  async run(agentCtx: AgentContext, options: { print?: boolean } = {}): Promise<EvalReport> {
    const { print = true } = options;
    const results: EvalResult[] = [];
    const start = Date.now();

    for (const c of this.cases) {
      const ctx: AgentContext = { ...agentCtx, sessionId: c.sessionId ?? crypto.randomUUID() };
      const t0 = Date.now();

      let output = '';
      let passed = false;
      let reason: string | undefined;

      try {
        const run = await this.agent.run(c.input, ctx);
        output = run.output;

        const verdict = await c.evaluator(output, {
          input: c.input,
          agent: this.agent,
          agentCtx: ctx,
        });

        if (typeof verdict === 'boolean') {
          passed = verdict;
        } else {
          const v = verdict as EvalVerdict;
          passed = v.passed;
          reason = v.reason;
        }
      } catch (err) {
        output = String(err);
        passed = false;
        reason = `Error: ${output}`;
      }

      results.push({ name: c.name, input: c.input, output, passed, reason, durationMs: Date.now() - t0 });
    }

    const report: EvalReport = {
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      total: results.length,
      passRate: results.length ? results.filter((r) => r.passed).length / results.length : 0,
      totalMs: Date.now() - start,
      cases: results,
    };

    if (print) printReport(report);
    return report;
  }
}
