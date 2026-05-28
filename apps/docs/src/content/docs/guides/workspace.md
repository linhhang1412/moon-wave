---
title: Workspace & AgentRouter
description: Run multiple agents in a single Cloudflare Worker and route requests by name with @moon-wave/workspace
---

`@moon-wave/workspace` provides two utilities:

- **`AgentRouter`** — serve multiple agents from one Worker with a clean REST API
- **`FileSystem`** — R2-backed file storage for agents that need to read/write files

## Install

```bash
npm install @moon-wave/workspace
```

---

## AgentRouter

Route HTTP requests to different agents based on a name in the URL path. Useful when you have several agents that share the same Worker but serve different purposes.

### Basic usage

```typescript
// src/index.ts
import { Agent } from '@moon-wave/core';
import { AgentRouter } from '@moon-wave/workspace';

export interface Env {
  GROQ_API_KEY: string;
}

const supportAgent = new Agent({
  name: 'support',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful customer support agent.',
  memory: 'none',
});

const codingAgent = new Agent({
  name: 'coding',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a senior software engineer. Help with code reviews and debugging.',
  memory: 'none',
});

const router = new AgentRouter();
router.register('support', supportAgent, 'Customer support');
router.register('coding', codingAgent, 'Software engineering help');

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env as unknown as Record<string, unknown>);
  },
};
```

### Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/agents` | List all registered agents |
| `GET` | `/agents/:name` | Get info about one agent |
| `POST` | `/agents/:name` | Run an agent |

### List agents

```bash
curl https://your-worker.workers.dev/agents
```

```json
[
  { "name": "support", "description": "Customer support" },
  { "name": "coding",  "description": "Software engineering help" }
]
```

### Run an agent

```bash
curl -X POST https://your-worker.workers.dev/agents/support \
  -H "Content-Type: application/json" \
  -d '{ "input": "How do I reset my password?" }'
```

```json
{
  "output": "To reset your password, go to the login page and click...",
  "iterations": 1,
  "toolCalls": []
}
```

Pass `sessionId` to preserve conversation history across requests (requires memory configured):

```bash
curl -X POST .../agents/support \
  -H "Content-Type: application/json" \
  -d '{ "input": "follow up question", "sessionId": "user-123" }'
```

### Combine with dashboard

`AgentRouter` and `@moon-wave/dashboard` work well together:

```typescript
import { AgentRouter } from '@moon-wave/workspace';
import { createDashboard } from '@moon-wave/dashboard';

const router = new AgentRouter();
router.register('support', supportAgent, 'Customer support');
router.register('coding', codingAgent, 'Engineering help');

const dashboard = createDashboard({
  agents: { support: supportAgent, coding: codingAgent },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/dashboard')) {
      return dashboard.handle(request, env as unknown as Record<string, unknown>);
    }
    return router.handle(request, env as unknown as Record<string, unknown>);
  },
};
```

This gives you:
- `GET /agents` — list all agents
- `POST /agents/:name` — call an agent
- `GET /dashboard` — interactive playground UI

### API reference

#### `new AgentRouter()`

Create a new router instance.

#### `router.register(name, agent, description?)`

Register an agent under a URL slug.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | URL-safe slug (e.g. `"support"`) |
| `agent` | `Agent` | Agent instance |
| `description` | `string` (optional) | Shown in `GET /agents` |

#### `router.handle(request, env)`

Handle an incoming `Request`. Returns a `Response`. Mount in your Worker's `fetch` handler.

---

## FileSystem

R2-backed file storage. Useful for agents that need to persist or read files (documents, knowledge bases, generated outputs).

### Setup

Add an R2 binding to your `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-workspace"
```

Add it to your `Env` type:

```typescript
export interface Env {
  BUCKET: R2Bucket;
}
```

### Usage

```typescript
import { FileSystem } from '@moon-wave/workspace';

const fs = new FileSystem(env.BUCKET, 'workspace-id');

// Write a file
await fs.write('notes.txt', 'hello world', 'text/plain');

// Read it back
const text = await fs.readText('notes.txt');

// List files
const files = await fs.list();

// Search across all text files
const results = await fs.grep('hello');
// → [{ path: 'notes.txt', line: 'hello world', lineNumber: 1 }]

// Delete
await fs.delete('notes.txt');
```

### API reference

```typescript
const fs = new FileSystem(r2: R2Bucket, workspaceId: string)

fs.write(path, content, contentType?)  → Promise<FileEntry>
fs.read(path)                          → Promise<ArrayBuffer | null>
fs.readText(path)                      → Promise<string | null>
fs.list(prefix?)                       → Promise<FileEntry[]>
fs.grep(query, filePrefix?)            → Promise<SearchResult[]>
fs.delete(path)                        → Promise<void>
```
