import type { Agent } from '@moon-wave/core';
import type { AgentContext } from '@moon-wave/types';

export interface EvalCase {
  name: string;
  input: string;
  evaluator: Evaluator;
  sessionId?: string;
}

export interface EvalResult {
  name: string;
  input: string;
  output: string;
  passed: boolean;
  reason?: string;
  durationMs: number;
}

export interface EvalReport {
  passed: number;
  failed: number;
  total: number;
  passRate: number;
  totalMs: number;
  cases: EvalResult[];
}

export type Evaluator = (output: string, ctx: EvalRunContext) => boolean | Promise<boolean | EvalVerdict>;

export interface EvalVerdict {
  passed: boolean;
  reason?: string;
}

export interface EvalRunContext {
  input: string;
  agent: Agent;
  agentCtx: AgentContext;
}
