---
title: Adding Memory
description: Give your agent persistent multi-turn conversation history
---

By default, agents are stateless. Adding memory lets your agent remember previous messages in a session.

## KV Memory (session history)

Best for: conversation history that doesn't need to persist beyond a few days.

```typescript
import { Agent } from '@moon-wave/core';

interface Env {
  GROQ_API_KEY: string;
  KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = new Agent({
      name: 'my-agent',
      model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      systemPrompt: 'You are a helpful assistant.',
      memory: 'kv',
    });

    const { sessionId, input } = await request.json() as { sessionId: string; input: string };
    const result = await agent.run(input, { sessionId, env });
    return Response.json({ output: result.output });
  },
};
```

Add the KV binding to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

Create it:

```bash
npx wrangler kv namespace create KV
```

## D1 Memory (persistent)

Best for: long-term conversation history stored in SQL.

```typescript
const agent = new Agent({
  name: 'my-agent',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  memory: 'd1',
});
```

Run the migration:

```bash
npx wrangler d1 execute my-db --file=./node_modules/@moon-wave/memory/migrations/001_init.sql
```

Add to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "my-agent-db"
database_id = "your-d1-id"
```

## Vectorize Memory (semantic search)

Best for: agents that need to recall relevant past context, not just recent messages.

Use `MemoryManager` directly when you need Vectorize alongside KV/D1:

```typescript
import { VectorizeAdapter, MemoryManager, KVMemoryAdapter, D1MemoryAdapter } from '@moon-wave/memory';

const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.KV),
  longTerm: new D1MemoryAdapter(env.DB),
  vector: new VectorizeAdapter(env.VECTORIZE, env.AI),
});

// Store a fact
await memory.remember('User prefers dark mode', { userId });

// Retrieve relevant facts
const facts = await memory.recall('user preferences', 3);
```
