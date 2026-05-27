import type { ToolDefinition, AgentContext } from '@moon-wave/types';
import type { Agent } from '@moon-wave/core';

export function agentAsTool(
  agent: Agent,
  config: { description: string },
): ToolDefinition {
  return {
    schema: {
      name: agent.name,
      description: config.description,
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Message to send to the agent' },
          sessionId: { type: 'string', description: 'Session ID to share context' },
        },
        required: ['input'],
      },
    },
    execute: async (args: Record<string, unknown>, ctx: AgentContext) => {
      const input = args.input as string;
      const sessionId = args.sessionId as string | undefined;
      const subCtx: AgentContext = {
        ...ctx,
        sessionId: sessionId ?? `${ctx.sessionId}:${agent.name}`,
      };
      const result = await agent.run(input, subCtx);
      return result.output;
    },
  };
}
