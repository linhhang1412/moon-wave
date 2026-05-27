---
title: Memory API
description: API reference for memory adapters and MemoryManager
---

## Adapters

### `KVMemoryAdapter`

```typescript
import { KVMemoryAdapter } from '@moon-wave/memory';

new KVMemoryAdapter(namespace: KVNamespace)
```

Stores conversation history in Cloudflare KV. Messages expire based on KV TTL settings.

### `D1MemoryAdapter`

```typescript
import { D1MemoryAdapter } from '@moon-wave/memory';

new D1MemoryAdapter(db: D1Database)
```

Stores conversation history in Cloudflare D1 (SQLite). Requires running the init migration.

### `VectorizeAdapter`

```typescript
import { VectorizeAdapter } from '@moon-wave/memory';

new VectorizeAdapter(index: VectorizeIndex, ai: Ai)
```

Stores and retrieves embeddings for semantic search.

### `NoopMemoryAdapter`

```typescript
import { NoopMemoryAdapter } from '@moon-wave/memory';

new NoopMemoryAdapter()
```

No-op adapter for testing or stateless use cases.

## `MemoryManager`

High-level class combining short-term + long-term + vector memory.

```typescript
import { MemoryManager } from '@moon-wave/memory';

const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.SESSIONS),
  longTerm: new D1MemoryAdapter(env.DB),       // optional
  vector: new VectorizeAdapter(env.VECTORIZE, env.AI), // optional
});
```

### Methods

```typescript
// Get conversation history for a session
await memory.getMessages(sessionId: string): Promise<Message[]>

// Add a message to history
await memory.addMessage(sessionId: string, message: Message): Promise<void>

// Clear a session
await memory.clearSession(sessionId: string): Promise<void>

// Store a fact in vector memory
await memory.remember(text: string, metadata?: Record<string, unknown>): Promise<void>

// Retrieve relevant facts by semantic similarity
await memory.recall(query: string, topK?: number): Promise<string[]>
```
