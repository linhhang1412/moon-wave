---
title: Groq
description: Use Groq's fast inference with moon-wave
---

[Groq](https://groq.com) offers extremely fast LLM inference with a generous free tier.

## Setup

Get an API key at [console.groq.com](https://console.groq.com).

```typescript
import { Agent } from '@moon-wave/core';

const agent = new Agent({
  name: 'my-agent',
  model: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  },
  systemPrompt: 'You are a helpful assistant.',
});
```

Set the key:

```bash
# Local dev
echo "GROQ_API_KEY=gsk_..." > .dev.vars

# Production
npx wrangler secret put GROQ_API_KEY
```

## Recommended models

| Model | Context | Best for |
|---|---|---|
| `llama-3.3-70b-versatile` | 128k | General purpose (recommended) |
| `llama-3.1-8b-instant` | 128k | Fast, lightweight tasks |
| `mixtral-8x7b-32768` | 32k | Complex reasoning |
| `gemma2-9b-it` | 8k | Efficient, multilingual |

## Environment variable

```typescript
interface Env {
  GROQ_API_KEY: string;
}
```
