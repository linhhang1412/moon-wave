import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { Agent } from '@moon-wave/core';
import type { AgentContext } from '@moon-wave/types';
import { Tracer } from '@moon-wave/observability';
import { z } from 'zod';
import { validateBearer, unauthorizedResponse, protectedResourceMetadata } from './auth.js';

interface RegisteredAgent {
  agent: Agent;
  description: string;
}

export interface MCPAgentServerConfig {
  bearerToken?: string;
  name?: string;
  version?: string;
}

export class MCPAgentServer {
  private agents = new Map<string, RegisteredAgent>();
  private traces = new Map<string, Tracer>();

  constructor(private config: MCPAgentServerConfig = {}) {}

  register(name: string, agent: Agent, description: string): this {
    this.agents.set(name, { agent, description });
    return this;
  }

  async handle(req: Request, env: Record<string, unknown>): Promise<Response> {
    const url = new URL(req.url);

    // RFC 9728 — protected resource discovery (no auth required)
    if (url.pathname === '/.well-known/oauth-protected-resource') {
      return protectedResourceMetadata(url.origin);
    }

    if (!validateBearer(req, this.config.bearerToken)) {
      return unauthorizedResponse();
    }

    const server = this.buildMcpServer(env);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    return transport.handleRequest(req);
  }

  private buildMcpServer(env: Record<string, unknown>): McpServer {
    const server = new McpServer({
      name: this.config.name ?? 'moon-wave',
      version: this.config.version ?? '0.1.0',
    });

    server.tool('list_agents', 'List all registered agents', {}, async () => {
      const list = Array.from(this.agents.entries()).map(([name, { description }]) => ({ name, description }));
      return { content: [{ type: 'text' as const, text: JSON.stringify(list) }] };
    });

    server.tool(
      'run_agent',
      'Run a registered agent with input',
      {
        agentName: z.string().describe('Name of the agent to run'),
        input: z.string().describe('Input message for the agent'),
        sessionId: z.string().optional().describe('Session ID for memory continuity'),
      },
      async ({ agentName, input, sessionId }) => {
        const entry = this.agents.get(agentName);
        if (!entry) {
          return {
            content: [{ type: 'text' as const, text: `Agent "${agentName}" not found` }],
            isError: true,
          };
        }

        const tracer = new Tracer();
        this.traces.set(tracer.traceId, tracer);

        const ctx: AgentContext = {
          sessionId: sessionId ?? crypto.randomUUID(),
          env,
          metadata: { traceId: tracer.traceId },
        };

        const spanId = tracer.startSpan('run_agent', { agentName, input });
        try {
          const result = await entry.agent.run(input, ctx);
          tracer.endSpan(spanId, 'ok');
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ ...result, traceId: tracer.traceId }),
              },
            ],
          };
        } catch (err) {
          tracer.endSpan(spanId, 'error', String(err));
          return {
            content: [{ type: 'text' as const, text: `Error: ${String(err)}` }],
            isError: true,
          };
        }
      },
    );

    server.tool(
      'create_session',
      'Create a new session ID',
      { userId: z.string().optional().describe('Optional user ID to associate with session') },
      async ({ userId }) => {
        const sessionId = crypto.randomUUID();
        return { content: [{ type: 'text' as const, text: JSON.stringify({ sessionId, userId }) }] };
      },
    );

    server.tool(
      'get_trace',
      'Get trace spans for a completed run',
      { traceId: z.string().describe('Trace ID returned from run_agent') },
      async ({ traceId }) => {
        const tracer = this.traces.get(traceId);
        if (!tracer) {
          return {
            content: [{ type: 'text' as const, text: `Trace "${traceId}" not found` }],
            isError: true,
          };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(tracer.getTrace()) }] };
      },
    );

    return server;
  }
}
