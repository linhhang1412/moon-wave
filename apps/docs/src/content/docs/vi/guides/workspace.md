---
title: Workspace & AgentRouter
description: Chạy nhiều agents trong một Cloudflare Worker và route requests theo tên với @moon-wave/workspace
---

`@moon-wave/workspace` cung cấp hai tiện ích:

- **`AgentRouter`** — phục vụ nhiều agents từ một Worker với REST API gọn gàng
- **`FileSystem`** — lưu trữ file trên R2 cho agents cần đọc/ghi files

## Cài đặt

```bash
npm install @moon-wave/workspace
```

---

## AgentRouter

Route HTTP requests đến các agents khác nhau dựa trên tên trong đường dẫn URL. Hữu ích khi có nhiều agents dùng chung một Worker nhưng phục vụ các mục đích khác nhau.

### Sử dụng cơ bản

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
  systemPrompt: 'Bạn là trợ lý hỗ trợ khách hàng.',
  memory: 'none',
});

const codingAgent = new Agent({
  name: 'coding',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Bạn là kỹ sư phần mềm cao cấp. Hỗ trợ review code và debug.',
  memory: 'none',
});

const router = new AgentRouter();
router.register('support', supportAgent, 'Hỗ trợ khách hàng');
router.register('coding', codingAgent, 'Hỗ trợ lập trình');

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env as unknown as Record<string, unknown>);
  },
};
```

### Các routes

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/agents` | Liệt kê tất cả agents đã đăng ký |
| `GET` | `/agents/:name` | Lấy thông tin một agent |
| `POST` | `/agents/:name` | Chạy một agent |

### Liệt kê agents

```bash
curl https://your-worker.workers.dev/agents
```

```json
[
  { "name": "support", "description": "Hỗ trợ khách hàng" },
  { "name": "coding",  "description": "Hỗ trợ lập trình" }
]
```

### Chạy một agent

```bash
curl -X POST https://your-worker.workers.dev/agents/support \
  -H "Content-Type: application/json" \
  -d '{ "input": "Tôi quên mật khẩu thì phải làm sao?" }'
```

```json
{
  "output": "Để đặt lại mật khẩu, bạn vào trang đăng nhập và nhấn...",
  "iterations": 1,
  "toolCalls": []
}
```

Truyền `sessionId` để giữ lịch sử hội thoại qua các request (yêu cầu memory đã cấu hình):

```bash
curl -X POST .../agents/support \
  -H "Content-Type: application/json" \
  -d '{ "input": "câu hỏi tiếp theo", "sessionId": "user-123" }'
```

### Kết hợp với dashboard

`AgentRouter` và `@moon-wave/dashboard` hoạt động tốt cùng nhau:

```typescript
import { AgentRouter } from '@moon-wave/workspace';
import { createDashboard } from '@moon-wave/dashboard';

const router = new AgentRouter();
router.register('support', supportAgent, 'Hỗ trợ khách hàng');
router.register('coding', codingAgent, 'Hỗ trợ lập trình');

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

Bạn sẽ có:
- `GET /agents` — liệt kê tất cả agents
- `POST /agents/:name` — gọi agent
- `GET /dashboard` — giao diện playground tương tác

### API reference

#### `new AgentRouter()`

Tạo router instance mới.

#### `router.register(name, agent, description?)`

Đăng ký một agent theo slug URL.

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `name` | `string` | Slug URL (ví dụ `"support"`) |
| `agent` | `Agent` | Instance agent |
| `description` | `string` (tùy chọn) | Hiển thị trong `GET /agents` |

#### `router.handle(request, env)`

Xử lý `Request` đến, trả về `Response`. Gắn vào `fetch` handler của Worker.

---

## FileSystem

Lưu trữ file trên R2. Hữu ích cho agents cần persist hoặc đọc files (tài liệu, knowledge base, output được tạo ra).

### Cấu hình

Thêm R2 binding vào `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-workspace"
```

Thêm vào kiểu `Env`:

```typescript
export interface Env {
  BUCKET: R2Bucket;
}
```

### Sử dụng

```typescript
import { FileSystem } from '@moon-wave/workspace';

const fs = new FileSystem(env.BUCKET, 'workspace-id');

// Ghi file
await fs.write('notes.txt', 'xin chào', 'text/plain');

// Đọc lại
const text = await fs.readText('notes.txt');

// Liệt kê files
const files = await fs.list();

// Tìm kiếm trong tất cả text files
const results = await fs.grep('xin chào');
// → [{ path: 'notes.txt', line: 'xin chào', lineNumber: 1 }]

// Xóa
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
