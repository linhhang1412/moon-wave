import type { Agent } from '@moon-wave/core';
import type { Evaluator, EvalRunContext, EvalVerdict } from '../types.js';

export interface LLMJudgeOptions {
  criteria: string;
  judgeAgent?: Agent;
  model?: { provider: string; model: string };
}

export function llmJudge(options: LLMJudgeOptions): Evaluator {
  return async (output: string, ctx: EvalRunContext): Promise<EvalVerdict> => {
    const judge = options.judgeAgent ?? ctx.agent;

    const prompt = [
      `You are an evaluator. Assess whether the following output meets the criteria.`,
      ``,
      `Criteria: ${options.criteria}`,
      ``,
      `Output to evaluate:`,
      `"""`,
      output,
      `"""`,
      ``,
      `Reply with PASS or FAIL followed by a one-sentence reason.`,
      `Example: PASS The output is a valid haiku with 5-7-5 syllable structure.`,
    ].join('\n');

    const result = await judge.run(prompt, ctx.agentCtx);
    const text = result.output.trim();
    const passed = text.toUpperCase().startsWith('PASS');
    const reason = text.replace(/^(PASS|FAIL)\s*/i, '').trim();

    return { passed, reason };
  };
}
