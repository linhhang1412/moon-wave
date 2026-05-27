---
title: Memory API
description: API reference cho memory adapters và MemoryManager
---

## Adapters

### `KVMemoryAdapter`

```typescript
new KVMemoryAdapter(namespace: KVNamespace)
```

Lưu lịch sử hội thoại trong Cloudflare KV.

### `D1MemoryAdapter`

```typescript
new D1MemoryAdapter(db: D1Database)
```

Lưu lịch sử hội thoại trong Cloudflare D1 (SQLite). Cần chạy init migration.

### `VectorizeAdapter`

```typescript
new VectorizeAdapter(index: VectorizeIndex, ai: Ai)
```

Lưu và truy xuất embeddings cho semantic search.

### `NoopMemoryAdapter`

```typescript
new NoopMemoryAdapter()
```

No-op adapter cho testing hoặc stateless.

## `MemoryManager`

```typescript
const memory = new MemoryManager({
  shortTerm: new KVMemoryAdapter(env.SESSIONS),
  longTerm: new D1MemoryAdapter(env.DB),       // tùy chọn
  vector: new VectorizeAdapter(env.VECTORIZE, env.AI), // tùy chọn
});
```

### Methods

```typescript
await memory.getMessages(sessionId)     // lấy lịch sử session
await memory.addMessage(sessionId, msg) // thêm tin nhắn
await memory.clearSession(sessionId)    // xóa session
await memory.remember(text, metadata?)  // lưu fact vào vector memory
await memory.recall(query, topK?)       // truy xuất facts liên quan
```
