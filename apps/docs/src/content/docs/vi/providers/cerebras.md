---
title: Cerebras
description: Dùng Cerebras ultra-fast inference với moon-wave
---

[Cerebras](https://cerebras.ai) cung cấp inference LLM nhanh nhất hiện tại — lý tưởng cho ứng dụng real-time.

## Setup

Lấy API key tại [cloud.cerebras.ai](https://cloud.cerebras.ai).

```typescript
const agent = new Agent({
  model: { provider: 'cerebras', model: 'llama3.3-70b' },
  systemPrompt: 'Bạn là trợ lý hữu ích.',
});
```

```bash
npx wrangler secret put CEREBRAS_API_KEY
```

## Models khuyến nghị

| Model | Phù hợp |
|---|---|
| `llama3.3-70b` | Chất lượng cao (khuyến nghị) |
| `llama3.1-8b` | Nhanh nhất, tác vụ nhẹ |
