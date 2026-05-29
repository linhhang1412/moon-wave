import type { ProjectConfig } from '../../types.js';
import { providerEnvKey } from '../constants.js';

// ─── src/shared/env.ts ────────────────────────────────────────────────────────

export function mcpSharedEnvTs(config: ProjectConfig): string {
  const { provider } = config;
  const envKey = providerEnvKey[provider];
  const providerLine =
    provider === 'workersai' ? '  AI: Ai;' : `  ${envKey}: string;`;

  return `export interface Env {
  MOON_WAVE_TOKEN: string;
${providerLine}
}
`;
}

// ─── src/features/agent/handler.ts ───────────────────────────────────────────

export function mcpAgentHandlerTs(config: ProjectConfig): string {
  const { name, provider, model } = config;

  return `import { Agent } from '@moon-wave/core';
import { MCPAgentServer } from '@moon-wave/mcp';
import type { Env } from '../../shared/env';

export async function mcpAgentHandler(req: Request, env: Env): Promise<Response> {
  const agent = new Agent({
    name: '${name}',
    model: { provider: '${provider}', model: '${model}' },
    systemPrompt: 'You are a helpful assistant.',
  });

  const server = new MCPAgentServer({ bearerToken: env.MOON_WAVE_TOKEN });
  server.register('${name}', agent, 'Helpful assistant agent');
  return server.handle(req, env as unknown as Record<string, unknown>);
}
`;
}

// ─── src/index.ts ─────────────────────────────────────────────────────────────

export function mcpIndexTs(): string {
  return `import { mcpAgentHandler } from './features/agent/handler';
import type { Env } from './shared/env';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return mcpAgentHandler(req, env);
  },
};
`;
}
