import type { Agent } from '@moon-wave/core';
import type { AgentResult } from '@moon-wave/types';
import { D1MemoryAdapter } from '@moon-wave/memory';
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

interface TraceRecord {
  id: string;
  agentName: string;
  input: string;
  output: string;
  iterations: number;
  durationMs: number;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
  timestamp: string;
  error?: string;
}

interface MetricsAccumulator {
  requestCount: number;
  errorCount: number;
  totalDurationMs: number;
  durations: number[];
  toolCallCount: number;
}

const MAX_TRACES = 50;
const MAX_INPUT_LENGTH = 10_000;
const AGENT_TIMEOUT_MS = 60_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export class DashboardServer {
  private agents: Record<string, Agent>;
  private token: string | undefined;
  private basePath: string;
  private traces: TraceRecord[] = [];
  private metrics: MetricsAccumulator = {
    requestCount: 0,
    errorCount: 0,
    totalDurationMs: 0,
    durations: [],
    toolCallCount: 0,
  };

  constructor(options: DashboardOptions) {
    this.agents = options.agents;
    this.token = options.auth?.token;
    this.basePath = options.basePath?.replace(/\/+$/, '') ?? '/dashboard';
  }

  private isAuthorized(req: Request): boolean {
    if (!this.token) return true;
    const auth = req.headers.get('Authorization');
    if (!auth) return false;
    const [scheme, token] = auth.split(' ');
    return scheme === 'Bearer' && token === this.token;
  }

  private addTrace(trace: TraceRecord): void {
    this.traces.unshift(trace);
    if (this.traces.length > MAX_TRACES) this.traces.length = MAX_TRACES;
  }

  async handle(req: Request, env: Record<string, unknown>): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

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

    // GET /api/agents — list agents
    if (path === this.basePath + '/api/agents' && req.method === 'GET') {
      const list = Object.entries(this.agents).map(([name, agent]) => ({
        name,
        description: (agent as Agent & { description?: string }).description ?? undefined,
      }));
      return json(list);
    }

    // GET /api/agents/:name/config — agent public config (MOON-9)
    const agentConfigMatch = path.match(new RegExp(`^${escapeRegex(this.basePath)}/api/agents/([^/]+)/config$`));
    if (agentConfigMatch && req.method === 'GET') {
      const name = decodeURIComponent(agentConfigMatch[1]);
      const agent = this.agents[name];
      if (!agent) return json({ error: `Agent "${name}" not found` }, 404);
      try {
        const config = (agent as Agent & { getPublicConfig?: () => unknown }).getPublicConfig?.();
        return json(config ?? { error: 'getPublicConfig not available' });
      } catch {
        return json({ error: 'Failed to get agent config' }, 500);
      }
    }

    // POST /api/run — run an agent (playground) (MOON-8: trace + metrics)
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

      const startMs = Date.now();
      try {
        const result = await withTimeout(
          agent.run(input, { sessionId: sessionId ?? crypto.randomUUID(), env }),
          AGENT_TIMEOUT_MS,
          `Agent "${agentName}"`,
        ) as AgentResult;
        const durationMs = Date.now() - startMs;

        this.metrics.requestCount++;
        this.metrics.totalDurationMs += durationMs;
        this.metrics.durations.push(durationMs);
        this.metrics.toolCallCount += result.toolCalls?.length ?? 0;

        this.addTrace({
          id: crypto.randomUUID(),
          agentName,
          input,
          output: result.output,
          iterations: result.iterations,
          durationMs,
          toolCalls: result.toolCalls ?? [],
          timestamp: new Date().toISOString(),
        });

        return json({ output: result.output, iterations: result.iterations, toolCalls: result.toolCalls, durationMs });
      } catch (err) {
        const durationMs = Date.now() - startMs;
        const message = err instanceof Error ? err.message : String(err);
        const isTimeout = message.includes('timed out');

        this.metrics.requestCount++;
        this.metrics.errorCount++;
        this.metrics.totalDurationMs += durationMs;
        this.metrics.durations.push(durationMs);

        this.addTrace({
          id: crypto.randomUUID(),
          agentName,
          input,
          output: '',
          iterations: 0,
          durationMs,
          toolCalls: [],
          timestamp: new Date().toISOString(),
          error: message,
        });

        return json({ error: message }, isTimeout ? 504 : 500);
      }
    }

    // GET /api/traces — list recent traces (MOON-8)
    if (path === this.basePath + '/api/traces' && req.method === 'GET') {
      const summary = this.traces.map(t => ({
        ...t,
        input: t.input.slice(0, 100) + (t.input.length > 100 ? '…' : ''),
        output: t.output.slice(0, 100) + (t.output.length > 100 ? '…' : ''),
      }));
      return json(summary);
    }

    // GET /api/traces/:id — full trace detail (MOON-8)
    const traceMatch = path.match(new RegExp(`^${escapeRegex(this.basePath)}/api/traces/([^/]+)$`));
    if (traceMatch && req.method === 'GET') {
      const id = traceMatch[1];
      const trace = this.traces.find(t => t.id === id);
      if (!trace) return json({ error: 'Trace not found' }, 404);
      return json(trace);
    }

    // GET /api/sessions — list D1 sessions (MOON-10)
    if (path === this.basePath + '/api/sessions' && req.method === 'GET') {
      if (!env.DB) {
        return json({ sessions: [], note: 'D1 not configured' });
      }
      try {
        const adapter = new D1MemoryAdapter(env.DB as never);
        const sessions = await adapter.listSessions();
        return json({ sessions });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    // DELETE /api/sessions/:id — delete a session (MOON-10)
    const sessionMatch = path.match(new RegExp(`^${escapeRegex(this.basePath)}/api/sessions/([^/]+)$`));
    if (sessionMatch && req.method === 'DELETE') {
      if (!env.DB) return json({ error: 'D1 not configured' }, 400);
      const sessionId = decodeURIComponent(sessionMatch[1]);
      try {
        const adapter = new D1MemoryAdapter(env.DB as never);
        await adapter.clearSession(sessionId);
        return json({ ok: true });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    // GET /api/metrics — request stats (MOON-7)
    if (path === this.basePath + '/api/metrics' && req.method === 'GET') {
      const { requestCount, errorCount, totalDurationMs, durations, toolCallCount } = this.metrics;
      const sorted = [...durations].sort((a, b) => a - b);
      return json({
        requestCount,
        errorCount,
        avgLatencyMs: requestCount ? Math.round(totalDurationMs / requestCount) : 0,
        p50LatencyMs: percentile(sorted, 50),
        p95LatencyMs: percentile(sorted, 95),
        toolCallRate: requestCount ? toolCallCount / requestCount : 0,
        errorRate: requestCount ? errorCount / requestCount : 0,
      });
    }

    return json({ error: 'Not found' }, 404);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
