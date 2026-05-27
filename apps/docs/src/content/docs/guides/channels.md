---
title: Channels
description: Connect your agent to Telegram or a web chat interface
---

Channels handle the transport layer — receiving messages from users and sending responses back.

## Telegram Bot

```typescript
import { Agent } from '@moon-wave/core';
import { TelegramChannel, ChannelRunner } from '@moon-wave/channels';

interface Env {
  GROQ_API_KEY: string;
  TELEGRAM_TOKEN: string;
}

const agent = new Agent({
  name: 'telegram-bot',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful Telegram bot.',
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const runner = new ChannelRunner(agent);
    const telegram = new TelegramChannel(env.TELEGRAM_TOKEN);
    return telegram.handle(request, runner, { sessionId: 'telegram', env });
  },
};
```

**Setup:**
1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Set the webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-worker.workers.dev`

```bash
npx wrangler secret put TELEGRAM_TOKEN
```

## Web Chat (SSE)

Streams responses via Server-Sent Events for a real-time chat experience:

```typescript
import { WebChatChannel, ChannelRunner } from '@moon-wave/channels';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const runner = new ChannelRunner(agent);
    const webchat = new WebChatChannel();
    return webchat.handle(request, runner, { sessionId: 'web', env });
  },
};
```

The client receives SSE events and can render tokens as they stream in.
