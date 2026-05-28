# @moon-wave/mcp

MCP (Model Context Protocol) server adapter for moon-wave — expose your agents as tools for Claude Code and other MCP clients.

## Installation

```bash
npm install @moon-wave/mcp @moon-wave/core
```

## Quick Start

```typescript
import { MCPAgentServer } from '@moon-wave/mcp';
import { Agent } from '@moon-wave/core';

const agent = new Agent({
  name: 'assistant',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
});

const server = new MCPAgentServer({
  bearerToken: env.MOON_WAVE_TOKEN,  // protect with a secret
  name: 'my-agents',
  version: '1.0.0',
});

server.register('assistant', agent, 'General-purpose assistant agent');

export default {
  async fetch(request: Request, env: Env) {
    return server.handle(request, env);
  },
};
```

## MCP Tools Exposed

| Tool | Description |
|------|-------------|
| `list_agents` | List all registered agents and their descriptions |
| `run_agent` | Run an agent by name with an input message |
| `create_session` | Generate a new session ID for memory continuity |
| `get_trace` | Retrieve span trace from a completed `run_agent` call |

## Connecting to Claude Code

After deploying to Cloudflare Workers, add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-agents": {
      "type": "http",
      "url": "https://your-worker.workers.dev",
      "headers": {
        "Authorization": "Bearer your-secret-token"
      }
    }
  }
}
```

Claude can then call your agents directly from the Claude Code CLI.

## Authentication

The server implements RFC 9728 (OAuth Protected Resource Discovery). Requests without a valid `Authorization: Bearer <token>` header receive a `401` response.

```typescript
// No auth (development only)
const server = new MCPAgentServer();

// With bearer token
const server = new MCPAgentServer({ bearerToken: env.MOON_WAVE_TOKEN });
```

## Tracing

Each `run_agent` call automatically creates a trace. Retrieve it with `get_trace`:

```typescript
// MCP client call
const runResult = await mcpClient.callTool('run_agent', {
  agentName: 'assistant',
  input: 'Hello!',
});
// runResult contains { output, traceId, ... }

const trace = await mcpClient.callTool('get_trace', {
  traceId: runResult.traceId,
});
```

## wrangler.toml

```toml
name = "my-mcp-server"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
# Set secrets via: wrangler secret put MOON_WAVE_TOKEN
```

## License

MIT
