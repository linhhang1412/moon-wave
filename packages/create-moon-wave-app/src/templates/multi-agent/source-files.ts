import type { ProjectConfig } from '../../types.js';
import { providerEnvKey, providerModel } from '../constants.js';

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

// ─── src/features/chat/agents/research.ts ────────────────────────────────────

export function researchAgentTs(config: ProjectConfig): string {
  const { memory } = config;
  return `import { Agent } from '@moon-wave/core';

export function createResearchAgent() {
  return new Agent({
    name: 'research',
    model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    systemPrompt: 'You are a research specialist. Find facts, analyze data, and summarize information accurately.',
    memory: '${memory}',
  });
}
`;
}

// ─── src/features/chat/agents/writer.ts ──────────────────────────────────────

export function writerAgentTs(config: ProjectConfig): string {
  const { memory } = config;
  return `import { Agent } from '@moon-wave/core';

export function createWriterAgent() {
  return new Agent({
    name: 'writer',
    model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    systemPrompt: 'You are a writing specialist. Transform research and ideas into clear, engaging content.',
    memory: '${memory}',
  });
}
`;
}

// ─── src/features/chat/network.ts ────────────────────────────────────────────

export function chatNetworkTs(config: ProjectConfig): string {
  const { provider } = config;
  const model = providerModel[provider];

  return `import { AgentNetwork } from '@moon-wave/multi-agent';
import { createResearchAgent } from './agents/research';
import { createWriterAgent } from './agents/writer';

export function createChatNetwork() {
  return new AgentNetwork({
    name: 'supervisor',
    routerModel: { provider: '${provider}', model: '${model}' },
    agents: [createResearchAgent(), createWriterAgent()],
  });
}
`;
}

// ─── src/features/chat/tools.ts ───────────────────────────────────────────────

export function chatToolsTs(): string {
  return `import { tool } from '@moon-wave/core';

// Add shared tools available to all agents. Example:
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
//   execute: async (args: { input: string }, _ctx) => {
//     return { result: args.input };
//   },
// });

export { tool };
export const sharedTools: ReturnType<typeof tool>[] = [];
`;
}

// ─── src/features/chat/handler.ts ────────────────────────────────────────────

export function chatHandlerTs(config: ProjectConfig): string {
  const { channel } = config;

  if (channel === 'telegram') {
    return `import { TelegramChannel, ChannelRunner } from '@moon-wave/channels';
import { createChatNetwork } from './network';
import type { Env } from '../../shared/env';

export async function chatHandler(request: Request, env: Env): Promise<Response> {
  const network = createChatNetwork();
  const telegram = new TelegramChannel(env.TELEGRAM_TOKEN);
  const runner = new ChannelRunner(telegram, network);
  return runner.handle(request, env as unknown as Record<string, unknown>);
}
`;
  }

  if (channel === 'webchat') {
    return `import { WebChatChannel, ChannelRunner } from '@moon-wave/channels';
import { createChatNetwork } from './network';
import type { Env } from '../../shared/env';

export async function chatHandler(request: Request, env: Env): Promise<Response> {
  const network = createChatNetwork();
  const webchat = new WebChatChannel();
  const runner = new ChannelRunner(webchat, network);
  return runner.handle(request, env as unknown as Record<string, unknown>);
}
`;
  }

  // channel === 'none' — plain HTTP with CORS
  return `import { corsHeaders } from '../../shared/cors';
import { createChatNetwork } from './network';
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

  const network = createChatNetwork();
  try {
    const result = await network.run(input, {
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
import { createChatNetwork } from './features/chat/network';
import { createDashboard } from '@moon-wave/dashboard';
import type { Env } from './shared/env';

const network = createChatNetwork();
const dashboard = createDashboard({
  agents: { '${name}': network as never },
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
