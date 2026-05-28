---
title: Self-Hosted Dashboard
description: Add a built-in playground and agent inspector to your Cloudflare Worker with @moon-wave/dashboard
---

`@moon-wave/dashboard` mounts a self-hosted UI at `/dashboard` inside your existing Worker. No separate deployment needed — add three lines of code and get an interactive playground, agent list, and tool-call inspector.

## Install

```bash
npm install @moon-wave/dashboard
```

## Add to your Worker

```typescript
// src/index.ts
import { Agent } from '@moon-wave/core';
import { createDashboard } from '@moon-wave/dashboard';

export interface Env {
  GROQ_API_KEY: string;
  DASHBOARD_TOKEN?: string;
}

const agent = new Agent({
  name: 'support',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful customer support agent.',
  memory: 'none',
});

const dashboard = createDashboard({
  agents: { support: agent },
  auth: { token: undefined }, // see "Protecting the dashboard" below
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Dashboard UI + API
    if (url.pathname.startsWith('/dashboard')) {
      return dashboard.handle(request, env as unknown as Record<string, unknown>);
    }

    // ... rest of your worker
  },
};
```

Open `http://localhost:8787/dashboard` after running `wrangler dev`.

## Multiple agents

Pass as many agents as you like. They all appear in the Playground selector:

```typescript
const dashboard = createDashboard({
  agents: {
    support: supportAgent,
    coding: codingAgent,
    analyst: analystAgent,
  },
});
```

## Dashboard tabs

| Tab | What it shows |
|-----|---------------|
| **Playground** | Chat window — select an agent, send messages, see responses and tool calls |
| **Agents** | List of registered agents with names and descriptions |

Each conversation in Playground gets its own `sessionId`, so messages are isolated between test runs.

## Protecting the dashboard

In production, set a Bearer token to prevent public access:

```bash
npx wrangler secret put DASHBOARD_TOKEN
```

Then pass it to `createDashboard`:

```typescript
const dashboard = createDashboard({
  agents: { support: agent },
  auth: { token: env.DASHBOARD_TOKEN },
});
```

Without `auth.token`, the dashboard is public (fine for local dev, not for production).

Authenticated requests must include:

```
Authorization: Bearer <your-token>
```

## Dashboard API

The dashboard also exposes a small REST API under `/dashboard/api/` for programmatic access:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/api/agents` | GET | List registered agents |
| `/dashboard/api/run` | POST | Run an agent |

**Run an agent via API:**

```bash
curl -X POST https://your-worker.workers.dev/dashboard/api/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "agentName": "support", "input": "hello", "sessionId": "abc" }'
```

Response:

```json
{
  "output": "Hello! How can I help you today?",
  "iterations": 1,
  "toolCalls": []
}
```

## Custom base path

By default the dashboard mounts at `/dashboard`. Override with `basePath`:

```typescript
const dashboard = createDashboard({
  agents: { support: agent },
  basePath: '/admin',  // now at /admin and /admin/api/*
});
```

## API reference

### `createDashboard(options)`

```typescript
createDashboard({
  agents: Record<string, Agent>,  // required
  auth?: {
    token?: string,               // Bearer token (optional)
  },
  basePath?: string,              // default: '/dashboard'
})
```

Returns a `DashboardServer` instance with a single method:

### `dashboard.handle(request, env)`

Handle an incoming `Request`. Mount in your Worker's `fetch` handler.
