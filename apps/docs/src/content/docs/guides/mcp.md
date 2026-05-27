---
title: MCP Server
description: Deploy your agents as tools in Claude Code using the Model Context Protocol
---

`@moon-wave/mcp` wraps any moon-wave agent as an [MCP](https://modelcontextprotocol.io) tool, making it callable directly from Claude Code and other MCP clients.

## Install

```bash
npm install @moon-wave/mcp
```

## Deploy a server

Create a Cloudflare Worker:

```typescript
// src/index.ts
import { Agent } from '@moon-wave/core';
import { MCPAgentServer } from '@moon-wave/mcp';

export interface Env {
  MOON_WAVE_TOKEN: string;
  GROQ_API_KEY: string;
}

const supportAgent = new Agent({
  name: 'support',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful customer support agent.',
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const server = new MCPAgentServer({
      bearerToken: env.MOON_WAVE_TOKEN,
    });
    server.register('support', supportAgent, 'Customer support agent');
    return server.handle(req, env as unknown as Record<string, unknown>);
  },
};
```

```toml
# wrangler.toml
name = "my-mcp-server"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
```

```bash
npx wrangler secret put MOON_WAVE_TOKEN   # your auth token (any string)
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

## Connect to Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-agents": {
      "type": "http",
      "url": "https://my-mcp-server.<subdomain>.workers.dev",
      "headers": {
        "Authorization": "Bearer <your-MOON_WAVE_TOKEN>"
      }
    }
  }
}
```

Restart Claude Code. Your agents are now available as tools.

## Available tools

| Tool | Description |
|------|-------------|
| `list_agents` | List all registered agents |
| `run_agent` | Run an agent with input |
| `create_session` | Create a session ID for memory continuity |
| `get_trace` | Get execution trace for debugging |

## Auth

The server uses **Bearer token** authentication (MCP OAuth 2.1 spec, static token mode):

- Set `bearerToken` → requires `Authorization: Bearer <token>` header
- Unset `bearerToken` → public mode (development only)

The server also exposes `/.well-known/oauth-protected-resource` for MCP client discovery.

## API reference

### `MCPAgentServer`

```typescript
const server = new MCPAgentServer({
  bearerToken?: string,  // optional auth token
  name?: string,         // server name (default: "moon-wave")
  version?: string,      // server version (default: "0.1.0")
});
```

### `server.register(name, agent, description)`

Register an agent as an MCP tool.

### `server.handle(req, env)`

Handle an incoming `Request` and return a `Response`. Use as your Worker's `fetch` handler.
