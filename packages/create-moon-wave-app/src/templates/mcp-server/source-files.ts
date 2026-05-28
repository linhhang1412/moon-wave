import type { ProjectConfig, Provider } from '../../types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

const providerModel: Record<Provider, string> = {
  groq: 'llama-3.3-70b-versatile',
  google: 'gemini-2.0-flash',
  cerebras: 'llama3.3-70b',
  workersai: '@cf/meta/llama-3.1-8b-instruct',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
};

export { providerEnvKey };

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
  const { name, provider } = config;
  const model = providerModel[provider];

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
