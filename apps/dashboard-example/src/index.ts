import { Agent } from '@moon-wave/core';
import { AgentRouter } from '@moon-wave/workspace';
import { createDashboard } from '@moon-wave/dashboard';

export interface Env {
  GROQ_API_KEY: string;
  DASHBOARD_TOKEN?: string;
  SESSIONS?: KVNamespace;
}

// --- Agents ---
const supportAgent = new Agent({
  name: 'support',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful customer support assistant. Be concise and friendly.',
  memory: 'none',
});

const codingAgent = new Agent({
  name: 'coding',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are an expert software engineer. Help with code reviews, debugging, and best practices.',
  memory: 'none',
});

// --- AgentRouter (for /agents/* REST API) ---
const router = new AgentRouter();
router.register('support', supportAgent, 'Customer support assistant');
router.register('coding', codingAgent, 'Software engineering assistant');

// --- Dashboard (for /dashboard) ---
const dashboard = createDashboard({
  agents: {
    support: supportAgent,
    coding: codingAgent,
  },
  auth: { token: undefined }, // set via DASHBOARD_TOKEN secret in production
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Dashboard UI + API
    if (url.pathname.startsWith('/dashboard')) {
      return dashboard.handle(request, env as unknown as Record<string, unknown>);
    }

    // Multi-agent REST API
    if (url.pathname.startsWith('/agents')) {
      return router.handle(request, env as unknown as Record<string, unknown>);
    }

    // Root — helpful redirect
    return new Response(
      JSON.stringify({
        message: 'moon-wave dashboard example',
        endpoints: {
          dashboard: '/dashboard',
          agents: 'GET /agents',
          run: 'POST /agents/:name  { "input": "..." }',
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  },
};
