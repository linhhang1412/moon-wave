---
title: Google Gemini
description: Dùng Google Gemini với moon-wave
---

[Google AI Studio](https://aistudio.google.com) cung cấp Gemini models với free tier hào phóng (tới 1.500 requests/ngày cho Gemini 2.0 Flash).

## Setup

Lấy API key tại [aistudio.google.com](https://aistudio.google.com/apikey).

```typescript
const agent = new Agent({
  model: { provider: 'google', model: 'gemini-2.0-flash' },
  systemPrompt: 'Bạn là trợ lý hữu ích.',
});
```

```bash
npx wrangler secret put GOOGLE_AI_KEY
```

## Models khuyến nghị

| Model | Context | Phù hợp |
|---|---|---|
| `gemini-2.0-flash` | 1M | Nhanh, đa dụng (khuyến nghị) |
| `gemini-1.5-pro` | 2M | Tác vụ phức tạp, tài liệu dài |
| `gemini-1.5-flash` | 1M | Tiết kiệm chi phí |
