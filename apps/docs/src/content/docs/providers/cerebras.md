---
title: Cerebras
description: Use Cerebras ultra-fast inference with moon-wave
---

[Cerebras](https://cerebras.ai) offers the fastest LLM inference available — significantly faster than GPU-based providers, ideal for real-time applications.

## Setup

Get an API key at [cloud.cerebras.ai](https://cloud.cerebras.ai).

```typescript
const agent = new Agent({
  name: 'my-agent',
  model: {
    provider: 'cerebras',
    model: 'llama3.3-70b',
  },
  systemPrompt: 'You are a helpful assistant.',
});
```

```bash
npx wrangler secret put CEREBRAS_API_KEY
```

## Recommended models

| Model | Best for |
|---|---|
| `llama3.3-70b` | Best quality (recommended) |
| `llama3.1-8b` | Fastest, lightweight tasks |

## Environment variable

```typescript
interface Env {
  CEREBRAS_API_KEY: string;
}
```
