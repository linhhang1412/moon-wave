# moon-wave MCP Server Example

Deploy moon-wave agents as tools in Claude Code (and any MCP-compatible client).

## Deploy

```bash
# 1. Install deps
pnpm install

# 2. Set secrets
npx wrangler secret put MOON_WAVE_TOKEN   # your auth token (any string)
npx wrangler secret put GROQ_API_KEY      # from console.groq.com

# 3. Deploy to Cloudflare Workers
pnpm deploy
```

Your MCP server will be live at `https://moon-wave-mcp-server.<your-subdomain>.workers.dev`.

## Connect to Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "moon-wave": {
      "type": "http",
      "url": "https://moon-wave-mcp-server.<your-subdomain>.workers.dev",
      "headers": {
        "Authorization": "Bearer <your-MOON_WAVE_TOKEN>"
      }
    }
  }
}
```

Restart Claude Code. You'll now have these tools available:

| Tool | Description |
|------|-------------|
| `list_agents` | List all available agents |
| `run_agent` | Run an agent with input |
| `create_session` | Create a new session for memory continuity |
| `get_trace` | Get execution trace for debugging |

## Customize

Edit `src/index.ts` to add your own agents:

```typescript
const myAgent = new Agent({
  name: 'my-agent',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Your system prompt here.',
});

server.register('my-agent', myAgent, 'Description shown in Claude Code');
```

## Auth

The server uses Bearer token auth (MCP OAuth 2.1 spec, static token mode).

- Set `MOON_WAVE_TOKEN` secret → server requires `Authorization: Bearer <token>` header
- Unset `MOON_WAVE_TOKEN` → server runs public (dev mode)
