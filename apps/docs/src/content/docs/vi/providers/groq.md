---
title: Groq
description: Dùng Groq inference nhanh với moon-wave
---

[Groq](https://groq.com) cung cấp inference LLM cực nhanh với free tier hào phóng.

## Setup

Lấy API key tại [console.groq.com](https://console.groq.com).

```typescript
const agent = new Agent({
  name: 'my-agent',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Bạn là trợ lý hữu ích.',
});
```

```bash
npx wrangler secret put GROQ_API_KEY
```

## Models khuyến nghị

| Model | Context | Phù hợp |
|---|---|---|
| `llama-3.3-70b-versatile` | 128k | Đa dụng (khuyến nghị) |
| `llama-3.1-8b-instant` | 128k | Nhanh, tác vụ nhẹ |
| `mixtral-8x7b-32768` | 32k | Lập luận phức tạp |
