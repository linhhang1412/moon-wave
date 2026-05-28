# @moon-wave/memory

Memory adapters for moon-wave — KV (short-term), D1 (long-term), and Vectorize (semantic recall).

## Installation

```bash
npm install @moon-wave/memory
```

## Adapters

### KV (short-term, 24h TTL)

Stores conversation history in Cloudflare KV. Fast, ephemeral, no schema required.

```typescript
// wrangler.toml
// [[kv_namespaces]]
// binding = "SESSIONS"
// id = "..."

import { MemoryManager, KVMemoryAdapter } from '@moon-wave/memory';

const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.SESSIONS, { maxMessages: 50 }),
});
```

### D1 (long-term, persistent)

Stores conversation history in Cloudflare D1 (SQLite). Survives Worker restarts and KV TTL.

```typescript
// Run migration once:
import { MESSAGES_MIGRATION } from '@moon-wave/memory';
await env.DB.exec(MESSAGES_MIGRATION);

import { MemoryManager, D1MemoryAdapter } from '@moon-wave/memory';

const memory = new MemoryManager({
  longTerm: new D1MemoryAdapter(env.DB),
  maxMessages: 100,  // LIMIT applied in SQL query
});
```

**D1 schema created by `MESSAGES_MIGRATION`:**
```sql
CREATE TABLE agent_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  role         TEXT NOT NULL,
  content      TEXT NOT NULL,
  tool_call_id TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Combined KV + D1

Use both: KV for fast reads, D1 for persistence. Reads prefer D1 when both are configured.

```typescript
const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.SESSIONS),
  longTerm: new D1MemoryAdapter(env.DB),
  maxMessages: 100,
});
```

### Vectorize (semantic recall)

Store and retrieve knowledge by semantic similarity.

```typescript
import { MemoryManager, VectorizeAdapter } from '@moon-wave/memory';

const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.SESSIONS),
  vector: new VectorizeAdapter(env.VECTORIZE),
});

await memory.remember('Paris is the capital of France', { topic: 'geography' });
const results = await memory.recall('What is the capital of France?', 5);
```

## API

```typescript
class MemoryManager {
  getMessages(sessionId: string): Promise<Message[]>
  addMessage(sessionId: string, message: Message): Promise<void>
  clearSession(sessionId: string): Promise<void>
  remember(text: string, metadata?: Record<string, unknown>): Promise<void>
  recall(query: string, topK?: number): Promise<string[]>
}
```

## Agent Configuration

Memory is configured via `AgentConfig`:

```typescript
const agent = new Agent({
  memory: 'kv',        // 'kv' | 'd1' | 'none'
  maxMessages: 50,     // max messages loaded per turn (default: 100)
  ...
});
```

## License

MIT
