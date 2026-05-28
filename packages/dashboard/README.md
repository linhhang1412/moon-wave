# @moon-wave/dashboard

Self-hosted dashboard and REST API for moon-wave agents — playground UI, execution traces, and session management.

## Installation

```bash
npm install @moon-wave/dashboard @moon-wave/core
```

## Quick Start

```typescript
import { DashboardServer } from '@moon-wave/dashboard';
import { Agent } from '@moon-wave/core';

const agent = new Agent({
  name: 'assistant',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
});

const dashboard = new DashboardServer();
dashboard.register('assistant', agent, 'General assistant');

export default {
  async fetch(request: Request, env: Env) {
    return dashboard.handle(request, env);
  },
};
```

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Dashboard UI (HTML) |
| `GET` | `/api/agents` | List all registered agents |
| `POST` | `/api/agents/:name/run` | Run an agent |
| `GET` | `/api/sessions/:id` | Get session message history |
| `DELETE` | `/api/sessions/:id` | Clear session history |
| `GET` | `/api/traces/:id` | Get execution trace |

**POST `/api/agents/:name/run` body:**
```json
{ "input": "Your message", "sessionId": "optional-session-id" }
```

**Response:**
```json
{
  "output": "Agent response",
  "iterations": 2,
  "toolCalls": [...],
  "traceId": "uuid"
}
```

All endpoints return CORS headers for browser access.

## Dashboard UI

Visiting `/` opens a browser-based playground where you can:
- Select an agent from a dropdown
- Send messages and view responses
- See tool calls made during each run
- Track session history

## wrangler.toml

```toml
name = "my-dashboard"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

## Security

The dashboard has no built-in authentication. For production use, add auth via Cloudflare Access or a custom middleware before `dashboard.handle()`.

## License

MIT
