import type { ProjectConfig, Provider } from '../../types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export const providerModel: Record<Provider, string> = {
  groq: 'llama-3.3-70b-versatile',
  google: 'gemini-2.0-flash',
  cerebras: 'llama3.3-70b',
  workersai: '@cf/meta/llama-3.1-8b-instruct',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
};

export { providerEnvKey };

// ─── src/shared/env.ts ────────────────────────────────────────────────────────

export function sharedEnvTs(config: ProjectConfig): string {
  const { provider, memory, channel, dashboard } = config;
  const envKey = providerEnvKey[provider];
  const lines: string[] = [];

  if (provider === 'workersai') {
    lines.push('  AI: Ai;');
  } else {
    lines.push(`  ${envKey}: string;`);
  }
  if (memory === 'kv') lines.push('  KV: KVNamespace;');
  if (memory === 'd1') lines.push('  DB: D1Database;');
  if (channel === 'telegram') lines.push('  TELEGRAM_TOKEN: string;');
  if (dashboard) lines.push('  DASHBOARD_TOKEN?: string;');

  return `export interface Env {\n${lines.join('\n')}\n}\n`;
}

// ─── src/shared/cors.ts ───────────────────────────────────────────────────────

export function sharedCorsTs(): string {
  return `export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;
`;
}

// ─── src/features/chat/agent.ts ───────────────────────────────────────────────

export function chatAgentTs(config: ProjectConfig): string {
  const { provider, memory, name } = config;
  const model = providerModel[provider];

  return `import { Agent } from '@moon-wave/core';

export function createChatAgent() {
  return new Agent({
    name: '${name}',
    model: { provider: '${provider}', model: '${model}' },
    systemPrompt: 'You are a helpful assistant.',
    memory: '${memory}',
  });
}
`;
}

// ─── src/features/chat/tools.ts ───────────────────────────────────────────────

export function chatToolsTs(): string {
  return `import { tool } from '@moon-wave/core';

// Add your feature tools here. Example:
// const myTool = tool({
//   name: 'my_tool',
//   description: 'Description of what the tool does',
//   parameters: {
//     type: 'object' as const,
//     properties: {
//       input: { type: 'string', description: 'The input value' },
//     },
//     required: ['input'],
//   },
//   execute: async ({ input }: { input: string }) => {
//     return { result: input };
//   },
// });

export { tool };
export const chatTools: ReturnType<typeof tool>[] = [];
`;
}

// ─── src/features/chat/handler.ts ────────────────────────────────────────────

export function chatHandlerTs(config: ProjectConfig): string {
  const { channel } = config;

  if (channel === 'telegram') {
    return `import { TelegramChannel, ChannelRunner } from '@moon-wave/channels';
import { createChatAgent } from './agent';
import { chatTools } from './tools';
import type { Env } from '../../shared/env';

export async function chatHandler(request: Request, env: Env): Promise<Response> {
  const agent = createChatAgent().use(...chatTools);
  const runner = new ChannelRunner(agent);
  const telegram = new TelegramChannel(env.TELEGRAM_TOKEN);
  return telegram.handle(request, runner, {
    sessionId: 'default',
    env: env as unknown as Record<string, unknown>,
  });
}
`;
  }

  if (channel === 'webchat') {
    return `import { WebChatChannel, ChannelRunner } from '@moon-wave/channels';
import { createChatAgent } from './agent';
import { chatTools } from './tools';
import type { Env } from '../../shared/env';

export async function chatHandler(request: Request, env: Env): Promise<Response> {
  const agent = createChatAgent().use(...chatTools);
  const runner = new ChannelRunner(agent);
  const webchat = new WebChatChannel();
  return webchat.handle(request, runner, {
    sessionId: 'default',
    env: env as unknown as Record<string, unknown>,
  });
}
`;
  }

  // channel === 'none' — plain HTTP with CORS
  return `import { corsHeaders } from '../../shared/cors';
import { createChatAgent } from './agent';
import { chatTools } from './tools';
import type { Env } from '../../shared/env';

export async function chatHandler(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let body: { input?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { input, sessionId } = body;
  if (!input?.trim()) {
    return new Response(JSON.stringify({ error: '"input" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const agent = createChatAgent().use(...chatTools);
  try {
    const result = await agent.run(input, {
      sessionId: sessionId ?? crypto.randomUUID(),
      env: env as unknown as Record<string, unknown>,
    });
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
`;
}

// ─── src/index.ts ─────────────────────────────────────────────────────────────

export function indexTs(config: ProjectConfig): string {
  const { dashboard, name } = config;

  if (dashboard) {
    return `import { chatHandler } from './features/chat/handler';
import { createChatAgent } from './features/chat/agent';
import { createDashboard } from '@moon-wave/dashboard';
import type { Env } from './shared/env';

const agent = createChatAgent();
const dashboard = createDashboard({
  agents: { '${name}': agent },
  auth: { token: undefined }, // set DASHBOARD_TOKEN secret to protect
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/dashboard')) {
      return dashboard.handle(request, env as unknown as Record<string, unknown>);
    }
    return chatHandler(request, env);
  },
};
`;
  }

  return `import { chatHandler } from './features/chat/handler';
import type { Env } from './shared/env';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return chatHandler(request, env);
  },
};
`;
}
