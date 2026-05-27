---
title: Channels
description: Kết nối agent với Telegram hoặc giao diện web chat
---

Channels xử lý tầng vận chuyển — nhận tin nhắn từ người dùng và gửi phản hồi lại.

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
  systemPrompt: 'Bạn là Telegram bot hữu ích, trả lời bằng tiếng Việt.',
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
1. Tạo bot qua [@BotFather](https://t.me/BotFather) trên Telegram
2. Set webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-worker.workers.dev`

```bash
npx wrangler secret put TELEGRAM_TOKEN
```

## Web Chat (SSE)

Stream phản hồi qua Server-Sent Events cho trải nghiệm chat real-time:

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
