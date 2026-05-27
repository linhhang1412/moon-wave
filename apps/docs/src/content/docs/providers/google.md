---
title: Google Gemini
description: Use Google Gemini models with moon-wave
---

[Google AI Studio](https://aistudio.google.com) provides access to Gemini models with a generous free tier (up to 1,500 requests/day for Gemini 2.0 Flash).

## Setup

Get an API key at [aistudio.google.com](https://aistudio.google.com/apikey).

```typescript
const agent = new Agent({
  name: 'my-agent',
  model: {
    provider: 'google',
    model: 'gemini-2.0-flash',
  },
  systemPrompt: 'You are a helpful assistant.',
});
```

```bash
npx wrangler secret put GOOGLE_AI_KEY
```

## Recommended models

| Model | Context | Best for |
|---|---|---|
| `gemini-2.0-flash` | 1M | Fast, general purpose (recommended) |
| `gemini-1.5-pro` | 2M | Complex tasks, large documents |
| `gemini-1.5-flash` | 1M | Cost-efficient tasks |

## Environment variable

```typescript
interface Env {
  GOOGLE_AI_KEY: string;
}
```

## Notes

Google AI Studio uses an OpenAI-compatible endpoint, so the integration is seamless with no special configuration needed.
