# moon-wave

> AI Agent Framework native on Cloudflare Workers

Build lightweight, composable AI agents that run natively on Cloudflare Workers — no Node.js server required.

## Packages

| Package | Description |
|---------|-------------|
| [`@moon-wave/types`](./packages/types) | Core TypeScript interfaces |
| [`@moon-wave/providers`](./packages/providers) | LLM Router: Groq, Workers AI, Ollama, Google, Cerebras |
| [`@moon-wave/memory`](./packages/memory) | Memory adapters: KV, D1, Vectorize |
| [`@moon-wave/core`](./packages/core) | Agent Loop, Tool Registry, SSE streaming |
| [`@moon-wave/workflow`](./packages/workflow) | Graph-based workflow engine |
| [`@moon-wave/multi-agent`](./packages/multi-agent) | Multi-agent patterns: Network, Handoff |
| [`@moon-wave/observability`](./packages/observability) | Distributed tracing |
| [`@moon-wave/channels`](./packages/channels) | Channels: Telegram, Web Chat |
| [`@moon-wave/workspace`](./packages/workspace) | R2-backed filesystem for agents |

## Quick Start

```bash
npm install @moon-wave/core @moon-wave/providers @moon-wave/memory
```

```typescript
import { Agent, tool } from '@moon-wave/core';

const agent = new Agent({
  name: 'my-agent',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  memory: 'kv',
}).use(
  tool({
    schema: {
      name: 'get_time',
      description: 'Get current time',
      parameters: { type: 'object', properties: {} },
    },
    execute: async () => new Date().toISOString(),
  })
);

export default {
  async fetch(request: Request, env: Env) {
    const { input, sessionId } = await request.json();
    const result = await agent.run(input, { sessionId, env });
    return Response.json(result);
  },
};
```

## Design Principles

- **Interface-first** — every component is swappable
- **No magic** — read the code, understand everything
- **Thin adapters** — logic in core, Cloudflare is just a runtime
- **Zero lock-in** — swap provider, memory, or channel with one line

## License

MIT
