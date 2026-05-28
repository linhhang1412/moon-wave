import type { Agent } from '@moon-wave/core';
import { buildDashboardHtml } from './ui';

export interface DashboardAuth {
  /** Optional Bearer token. If omitted, dashboard is public (dev mode). */
  token?: string;
}

export interface DashboardOptions {
  /** Map of agent name → Agent instance */
  agents: Record<string, Agent>;
  /** Optional auth config */
  auth?: DashboardAuth;
  /** Base path for dashboard routes, default: /dashboard */
  basePath?: string;
}

const MAX_INPUT_LENGTH = 10_000;
const AGENT_TIMEOUT_MS = 60_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Bearer realm="moon-wave-dashboard"',
      'Content-Type': 'text/plain',
      ...corsHeaders,
    },
  });
}

function badRequest(message: string): Response {
  return json({ error: message }, 400);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export class DashboardServer {
  private agents: Record<string, Agent>;
  private token: string | undefined;
  private basePath: string;

  constructor(options: DashboardOptions) {
    this.agents = options.agents;
    this.token = options.auth?.token;
    this.basePath = options.basePath?.replace(/\/+$/, '') ?? '/dashboard';
  }

  private isAuthorized(req: Request): boolean {
    if (!this.token) return true; // public / dev mode
    const auth = req.headers.get('Authorization');
    if (!auth) return false;
    const [scheme, token] = auth.split(' ');
    return scheme === 'Bearer' && token === this.token;
  }

  async handle(req: Request, env: Record<string, unknown>): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Check auth for all API routes (not needed for the UI itself)
    const isApiRoute = path.startsWith(this.basePath + '/api/');
    if (isApiRoute && !this.isAuthorized(req)) {
      return unauthorized();
    }

    // Serve the dashboard SPA
    if (path === this.basePath || path === this.basePath + '/') {
      return new Response(buildDashboardHtml(this.basePath), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // GET /dashboard/api/agents — list agents
    if (path === this.basePath + '/api/agents' && req.method === 'GET') {
      const list = Object.entries(this.agents).map(([name, agent]) => ({
        name,
        // Access agent description if available (added by user via register)
        description: (agent as Agent & { description?: string }).description ?? undefined,
      }));
      return json(list);
    }

    // POST /dashboard/api/run — run an agent (playground)
    if (path === this.basePath + '/api/run' && req.method === 'POST') {
      let body: { agentName?: string; input?: string; sessionId?: string };
      try {
        body = await req.json() as { agentName?: string; input?: string; sessionId?: string };
      } catch {
        return badRequest('Invalid JSON body');
      }

      const { agentName, input, sessionId } = body;
      if (!agentName) return badRequest('"agentName" is required');
      if (!input?.trim()) return badRequest('"input" is required');
      if (input.length > MAX_INPUT_LENGTH) {
        return badRequest(`Input too long (max ${MAX_INPUT_LENGTH} characters)`);
      }

      const agent = this.agents[agentName];
      if (!agent) return json({ error: `Agent "${agentName}" not found` }, 404);

      try {
        const result = await withTimeout(
          agent.run(input, { sessionId: sessionId ?? crypto.randomUUID(), env }),
          AGENT_TIMEOUT_MS,
          `Agent "${agentName}"`,
        );
        return json(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isTimeout = message.includes('timed out');
        return json({ error: message }, isTimeout ? 504 : 500);
      }
    }

    return json({ error: 'Not found' }, 404);
  }
}
