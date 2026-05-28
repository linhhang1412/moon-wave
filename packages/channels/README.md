# @moon-wave/channels

Chat channel integrations for moon-wave — Telegram bot and web chat with SSE streaming.

## Installation

```bash
npm install @moon-wave/channels @moon-wave/core
```

## Telegram

```typescript
import { TelegramChannel, ChannelRunner } from '@moon-wave/channels';
import { Agent } from '@moon-wave/core';

const agent = new Agent({ name: 'bot', model: { provider: 'groq', model: 'llama-3.3-70b-versatile' } });

const channel = new TelegramChannel({
  botToken: env.TELEGRAM_BOT_TOKEN,
  secretToken: env.TELEGRAM_SECRET_TOKEN, // optional webhook verification
});

const runner = new ChannelRunner(channel, agent);

export default {
  async fetch(request: Request, env: Env) {
    return runner.handle(request, env);
  },
};
```

**Set up webhook:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-worker.workers.dev" \
  -d "secret_token=<SECRET>"
```

## Web Chat (SSE streaming)

```typescript
import { WebChatChannel, ChannelRunner, createSSEResponse } from '@moon-wave/channels';

const channel = new WebChatChannel();
const runner = new ChannelRunner(channel, agent);

export default {
  async fetch(request: Request, env: Env) {
    // POST /chat — standard request/response
    if (request.method === 'POST') {
      return runner.handle(request, env);
    }

    // GET /chat?input=... — streaming SSE response
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const input = url.searchParams.get('input') ?? '';
      const sessionId = url.searchParams.get('sessionId') ?? crypto.randomUUID();
      return createSSEResponse(agent, input, { sessionId, env });
    }
  },
};
```

## Custom Context

Enrich the `AgentContext` with data from the incoming message:

```typescript
const runner = new ChannelRunner(channel, agent, (incoming) => ({
  userId: incoming.userId,
  metadata: { platform: incoming.channelType, firstName: incoming.metadata?.firstName },
}));
```

## API

### `ChannelRunner`

```typescript
class ChannelRunner {
  constructor(
    channel: Channel,
    agent: Agent,
    buildContext?: (msg: IncomingMessage) => Partial<AgentContext>
  )
  handle(request: Request, env: Record<string, unknown>): Promise<Response>
}
```

### `TelegramChannel`

```typescript
new TelegramChannel({ botToken: string, secretToken?: string })
```

Long messages are automatically split at 4096 characters (Telegram limit).

### `WebChatChannel`

```typescript
new WebChatChannel()
// POST body: { text: string, sessionId: string, userId?: string, stream?: boolean }
```

### `Channel` interface

Implement to add any messaging platform:

```typescript
interface Channel {
  verify(request: Request): Promise<boolean>
  parse(request: Request): Promise<IncomingMessage | null>
  send(message: OutgoingMessage, incoming: IncomingMessage): Promise<void>
}
```

## License

MIT
