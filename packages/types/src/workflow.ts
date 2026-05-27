import type { AgentContext } from './agent';

export interface WorkflowContext {
  agentCtx: AgentContext;
  results: Record<string, unknown>;
  metadata: Record<string, unknown>;
  input: unknown;
}

export interface WorkflowStep<TOutput = unknown> {
  name: string;
  execute(ctx: WorkflowContext): Promise<TOutput>;
  next?(result: TOutput, ctx: WorkflowContext): string | null;
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
}
