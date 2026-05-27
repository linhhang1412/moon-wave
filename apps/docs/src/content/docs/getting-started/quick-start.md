---
title: Quick Start
description: Build your first moon-wave agent in 5 minutes
---

This guide creates a simple agent that answers questions using Groq.

## 1. Create the project

```bash
npx create-moon-wave-app my-agent
# Choose: Groq → None (memory) → None (channel) → Yes (install)
cd my-agent
```

Or manually:

```bash
mkdir my-agent && cd my-agent
npm init -y
npm install @moon-wave/core @moon-wave/providers wrangler
```

## 2. Write the agent

```typescript
// src/index.ts
import { Agent } from '@moon-wave/core';
import { GroqProvider } from '@moon-wave/providers';

interface Env {
  GROQ_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = new Agent({
      name: 'my-agent',
      model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      systemPrompt: 'You are a helpful assistant.',
    });

    const url = new URL(request.url);
    const input = url.searchParams.get('q') ?? 'Hello!';

    const result = await agent.run(input, {
      sessionId: 'demo',
      env,
    });

    return new Response(result.output);
  },
};
```

## 3. Set your API key

```bash
# For local dev
echo "GROQ_API_KEY=your_key_here" > .dev.vars

# For production
npx wrangler secret put GROQ_API_KEY
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

## 4. Run locally

```bash
npx wrangler dev
```

Visit `http://localhost:8787?q=What+is+the+capital+of+France?`

## 5. Deploy

```bash
npx wrangler deploy
```

Your agent is now live at `https://my-agent.your-subdomain.workers.dev`.

## Next steps

- [Add tools to your agent](/guides/tools)
- [Add memory for multi-turn conversations](/guides/memory)
- [Connect a Telegram bot](/guides/channels)
