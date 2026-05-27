import type { ToolSchema } from './llm';
import type { AgentContext } from './agent';

export type { ToolSchema };

export interface ToolDefinition<
  TArgs = Record<string, unknown>,
  TResult = unknown,
> {
  schema: ToolSchema;
  execute: (args: TArgs, ctx: AgentContext) => Promise<TResult>;
}
