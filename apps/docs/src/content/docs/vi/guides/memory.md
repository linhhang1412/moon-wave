---
title: Thêm Memory
description: Cho agent lưu lịch sử hội thoại nhiều lượt
---

Mặc định, agent không có trạng thái. Thêm memory để agent nhớ các tin nhắn trước trong một session.

## KV Memory (lịch sử session)

Phù hợp cho: lịch sử hội thoại không cần lưu quá vài ngày.

```typescript
import { Agent } from '@moon-wave/core';
import { KVMemoryAdapter } from '@moon-wave/memory';

interface Env {
  GROQ_API_KEY: string;
  SESSIONS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = new Agent({
      name: 'my-agent',
      model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      systemPrompt: 'Bạn là trợ lý hữu ích.',
      memory: {
        type: 'kv',
        adapter: new KVMemoryAdapter(env.SESSIONS),
      },
    });

    const { sessionId, input } = await request.json() as { sessionId: string; input: string };
    const result = await agent.run(input, { sessionId, env });
    return Response.json({ output: result.output });
  },
};
```

Thêm KV binding vào `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"
```

Tạo KV namespace:

```bash
npx wrangler kv namespace create SESSIONS
```

## D1 Memory (persistent)

Phù hợp cho: lịch sử hội thoại lưu lâu dài trong SQL.

```typescript
import { D1MemoryAdapter } from '@moon-wave/memory';

const agent = new Agent({
  // ...
  memory: {
    type: 'd1',
    adapter: new D1MemoryAdapter(env.DB),
  },
});
```

Chạy migration:

```bash
npx wrangler d1 execute my-db --file=./node_modules/@moon-wave/memory/migrations/001_init.sql
```

## Vectorize Memory (semantic search)

Phù hợp cho: agent cần gợi lại context liên quan từ quá khứ, không chỉ tin nhắn gần nhất.

```typescript
import { VectorizeAdapter, MemoryManager } from '@moon-wave/memory';

const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.SESSIONS),
  longTerm: new D1MemoryAdapter(env.DB),
  vector: new VectorizeAdapter(env.VECTORIZE, env.AI),
});

// Lưu một sự kiện
await memory.remember('User thích dark mode', { userId });

// Truy xuất thông tin liên quan
const facts = await memory.recall('sở thích giao diện', 3);
```
