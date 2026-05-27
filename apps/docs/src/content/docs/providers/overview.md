---
title: Providers Overview
description: Supported LLM providers and how to switch between them
---

moon-wave provides a unified interface across multiple LLM providers. All providers implement the same `LLMProvider` interface, so switching is a one-line change.

## Supported providers

| Provider | Package import | Best for |
|---|---|---|
| **Groq** | `GroqProvider` | Fast inference, free tier |
| **Google Gemini** | `GoogleProvider` | Long context, generous free tier |
| **Cerebras** | `CerebrasProvider` | Ultra-fast inference |
| **Workers AI** | `WorkersAIProvider` | No API key, runs on Cloudflare |

## Using LLMRouter

Register multiple providers and switch at runtime:

```typescript
import { LLMRouter } from '@moon-wave/providers';

const router = new LLMRouter()
  .register('groq', { apiKey: env.GROQ_API_KEY })
  .register('google', { apiKey: env.GOOGLE_AI_KEY })
  .register('cerebras', { apiKey: env.CEREBRAS_API_KEY });

// Use a specific provider
const provider = router.get('groq');
```

The `Agent` class uses `LLMRouter` internally — just set `model.provider` in config:

```typescript
const agent = new Agent({
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  // ...
});
```
