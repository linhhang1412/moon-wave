---
title: Workers AI
description: Chạy LLM trên hạ tầng Cloudflare, không cần API key
---

[Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) chạy models trên GPU fleet của Cloudflare. Không cần API key bên ngoài — tính phí qua tài khoản Cloudflare.

## Setup

Không cần API key. Thêm AI binding vào `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

```typescript
const agent = new Agent({
  model: { provider: 'workersai', model: '@cf/meta/llama-3.1-8b-instruct' },
  systemPrompt: 'Bạn là trợ lý hữu ích.',
});
```

## Models khuyến nghị

| Model | Phù hợp |
|---|---|
| `@cf/meta/llama-3.1-8b-instruct` | Đa dụng (free tier) |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Chất lượng cao hơn |

## Free tier

Workers AI có 10.000 neurons/ngày ở plan miễn phí.
