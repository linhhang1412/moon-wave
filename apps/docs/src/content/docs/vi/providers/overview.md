---
title: Tổng quan Providers
description: Các LLM provider được hỗ trợ và cách chuyển đổi
---

moon-wave cung cấp interface thống nhất cho nhiều LLM provider. Chuyển provider chỉ cần thay một dòng.

## Providers được hỗ trợ

| Provider | Import | Phù hợp cho |
|---|---|---|
| **Groq** | `GroqProvider` | Inference nhanh, free tier |
| **Google Gemini** | `GoogleProvider` | Context dài, free tier hào phóng |
| **Cerebras** | `CerebrasProvider` | Inference cực nhanh |
| **Workers AI** | `WorkersAIProvider` | Không cần API key, chạy trên Cloudflare |

## Dùng LLMRouter

Đăng ký nhiều provider và chuyển đổi lúc runtime:

```typescript
import { LLMRouter } from '@moon-wave/providers';

const router = new LLMRouter()
  .register('groq', { apiKey: env.GROQ_API_KEY })
  .register('google', { apiKey: env.GOOGLE_AI_KEY })
  .register('cerebras', { apiKey: env.CEREBRAS_API_KEY });

const provider = router.get('groq');
```

Class `Agent` dùng `LLMRouter` nội bộ — chỉ cần set `model.provider` trong config:

```typescript
const agent = new Agent({
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  // ...
});
```
