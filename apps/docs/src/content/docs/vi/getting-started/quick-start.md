---
title: Quick Start
description: Tạo AI agent đầu tiên với moon-wave trong 5 phút
---

Hướng dẫn này tạo một agent đơn giản trả lời câu hỏi bằng Groq.

## 1. Tạo project

```bash
npx create-moon-wave-app my-agent
# Chọn: Groq → None (memory) → None (channel) → Yes (install)
cd my-agent
```

Hoặc thủ công:

```bash
mkdir my-agent && cd my-agent
npm init -y
npm install @moon-wave/core @moon-wave/providers wrangler
```

## 2. Viết agent

```typescript
// src/index.ts
import { Agent } from '@moon-wave/core';

interface Env {
  GROQ_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = new Agent({
      name: 'my-agent',
      model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      systemPrompt: 'Bạn là trợ lý AI hữu ích.',
    });

    const url = new URL(request.url);
    const input = url.searchParams.get('q') ?? 'Xin chào!';

    const result = await agent.run(input, {
      sessionId: 'demo',
      env,
    });

    return new Response(result.output);
  },
};
```

## 3. Đặt API key

```bash
# Cho local dev
echo "GROQ_API_KEY=your_key_here" > .dev.vars

# Cho production
npx wrangler secret put GROQ_API_KEY
```

Lấy Groq API key miễn phí tại [console.groq.com](https://console.groq.com).

## 4. Chạy local

```bash
npx wrangler dev
```

Truy cập `http://localhost:8787?q=Thủ+đô+Việt+Nam+là+gì?`

## 5. Deploy

```bash
npx wrangler deploy
```

Agent của bạn đang live tại `https://my-agent.your-subdomain.workers.dev`.

## Bước tiếp theo

- [Thêm tools vào agent](/vi/guides/tools)
- [Thêm memory cho hội thoại nhiều lượt](/vi/guides/memory)
- [Kết nối Telegram bot](/vi/guides/channels)
