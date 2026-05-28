---
title: Self-Hosted Dashboard
description: Thêm playground và agent inspector vào Cloudflare Worker với @moon-wave/dashboard
---

`@moon-wave/dashboard` gắn một UI tự-host tại `/dashboard` ngay bên trong Worker hiện có của bạn. Không cần deploy thêm — chỉ cần thêm vài dòng code là có ngay playground tương tác, danh sách agents, và inspector tool calls.

## Cài đặt

```bash
npm install @moon-wave/dashboard
```

## Thêm vào Worker

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
  systemPrompt: 'Bạn là trợ lý hỗ trợ khách hàng.',
  memory: 'none',
});

const dashboard = createDashboard({
  agents: { support: agent },
  auth: { token: undefined }, // xem phần "Bảo vệ dashboard" bên dưới
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Dashboard UI + API
    if (url.pathname.startsWith('/dashboard')) {
      return dashboard.handle(request, env as unknown as Record<string, unknown>);
    }

    // ... phần còn lại của worker
  },
};
```

Mở `http://localhost:8787/dashboard` sau khi chạy `wrangler dev`.

## Nhiều agents

Truyền bao nhiêu agents tùy ý, tất cả đều xuất hiện trong dropdown của Playground:

```typescript
const dashboard = createDashboard({
  agents: {
    support: supportAgent,
    coding: codingAgent,
    analyst: analystAgent,
  },
});
```

## Các tab trong Dashboard

| Tab | Nội dung |
|-----|----------|
| **Playground** | Cửa sổ chat — chọn agent, gửi tin nhắn, xem phản hồi và tool calls |
| **Agents** | Danh sách agents đã đăng ký với tên và mô tả |

Mỗi cuộc trò chuyện trong Playground có `sessionId` riêng, nên các lần test không ảnh hưởng lẫn nhau.

## Bảo vệ dashboard

Trong môi trường production, đặt Bearer token để ngăn truy cập công khai:

```bash
npx wrangler secret put DASHBOARD_TOKEN
```

Sau đó truyền vào `createDashboard`:

```typescript
const dashboard = createDashboard({
  agents: { support: agent },
  auth: { token: env.DASHBOARD_TOKEN },
});
```

Nếu không có `auth.token`, dashboard ở chế độ public (ổn khi dev local, không nên dùng trên production).

Request đã xác thực phải có header:

```
Authorization: Bearer <your-token>
```

## Dashboard API

Dashboard cũng expose một REST API nhỏ ở `/dashboard/api/` để gọi lập trình:

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/dashboard/api/agents` | GET | Liệt kê agents đã đăng ký |
| `/dashboard/api/run` | POST | Chạy một agent |

**Chạy agent qua API:**

```bash
curl -X POST https://your-worker.workers.dev/dashboard/api/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "agentName": "support", "input": "xin chào", "sessionId": "abc" }'
```

Phản hồi:

```json
{
  "output": "Xin chào! Tôi có thể giúp gì cho bạn?",
  "iterations": 1,
  "toolCalls": []
}
```

## Thay đổi base path

Mặc định dashboard gắn tại `/dashboard`. Ghi đè với `basePath`:

```typescript
const dashboard = createDashboard({
  agents: { support: agent },
  basePath: '/admin',  // giờ ở /admin và /admin/api/*
});
```

## API reference

### `createDashboard(options)`

```typescript
createDashboard({
  agents: Record<string, Agent>,  // bắt buộc
  auth?: {
    token?: string,               // Bearer token (tùy chọn)
  },
  basePath?: string,              // mặc định: '/dashboard'
})
```

Trả về instance `DashboardServer` với một method:

### `dashboard.handle(request, env)`

Xử lý `Request` đến. Gắn vào `fetch` handler của Worker.
