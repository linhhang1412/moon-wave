---
title: Workers AI
description: Run LLMs on Cloudflare's infrastructure with no API key
---

[Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) runs models on Cloudflare's GPU fleet. No external API key required — billed through your Cloudflare account.

## Setup

No API key needed. Add the AI binding to `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

```typescript
interface Env {
  AI: Ai;
}

const agent = new Agent({
  name: 'my-agent',
  model: {
    provider: 'workersai',
    model: '@cf/meta/llama-3.1-8b-instruct',
  },
  systemPrompt: 'You are a helpful assistant.',
});
```

## Recommended models

| Model | Best for |
|---|---|
| `@cf/meta/llama-3.1-8b-instruct` | General purpose (free tier) |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Higher quality |
| `@cf/mistral/mistral-7b-instruct-v0.2` | Lightweight tasks |

View all models at [developers.cloudflare.com/workers-ai/models](https://developers.cloudflare.com/workers-ai/models/).

## Free tier

Workers AI includes 10,000 neurons/day on the free plan. Most chat completions use 100–500 neurons each.
