import type { Agent } from '@moon-wave/core';
import type { AgentResult } from '@moon-wave/types';

export interface AgentInfo {
  name: string;
  description?: string;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export class AgentRouter {
  private agents = new Map<string, { agent: Agent; description?: string }>();

  register(name: string, agent: Agent, description?: string): this {
    this.agents.set(name, { agent, description });
    return this;
  }

  async handle(req: Request, env: Record<string, unknown>): Promise<Response> {
    const url = new URL(req.url);
    // Match /agents or /agents/ or /agents/:name
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');

    // Expect paths like /agents, /agents/:name
    if (parts[0] !== 'agents') {
      return json({ error: 'Not found' }, 404);
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const agentName = parts[1];

    // GET /agents — list all agents
    if (!agentName && req.method === 'GET') {
      const list: AgentInfo[] = [];
      for (const [name, { description }] of this.agents) {
        list.push({ name, description });
      }
      return json(list);
    }

    // GET /agents/:name — agent info
    if (agentName && req.method === 'GET') {
      const entry = this.agents.get(agentName);
      if (!entry) return json({ error: `Agent "${agentName}" not found` }, 404);
      return json({ name: agentName, description: entry.description });
    }

    // POST /agents/:name — run agent
    if (agentName && req.method === 'POST') {
      const entry = this.agents.get(agentName);
      if (!entry) return json({ error: `Agent "${agentName}" not found` }, 404);

      let body: { input?: string; sessionId?: string };
      try {
        body = await req.json() as { input?: string; sessionId?: string };
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      const { input, sessionId } = body;
      if (!input?.trim()) {
        return json({ error: '"input" is required' }, 400);
      }

      try {
        const result: AgentResult = await entry.agent.run(input, {
          sessionId: sessionId ?? crypto.randomUUID(),
          env,
        });
        return json(result);
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    return json({ error: 'Method not allowed' }, 405);
  }
}
