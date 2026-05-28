# @moon-wave/core

Agent loop, tool registry, and SSE streaming — the heart of moon-wave.

## Installation

```bash
npm install @moon-wave/core @moon-wave/providers @moon-wave/memory
```

## Quick Start

```typescript
import { Agent, tool } from '@moon-wave/core';

const getTime = tool({
  schema: {
    name: 'get_time',
    description: 'Get the current UTC time',
    parameters: { type: 'object', properties: {} },
  },
  execute: async () => new Date().toISOString(),
});

const agent = new Agent({
  name: 'assistant',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  memory: 'kv',
}).use(getTime);

// Cloudflare Workers handler
export default {
  async fetch(request: Request, env: Env) {
    const { input, sessionId } = await request.json<{ input: string; sessionId: string }>();
    const result = await agent.run(input, { sessionId, env });
    return Response.json(result);
  },
};
```

## API

### `Agent`

```typescript
const agent = new Agent(config: AgentConfig);
```

**Config options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | required | Agent identifier |
| `model` | `ModelConfig` | required | `{ provider, model }` |
| `systemPrompt` | `string \| (ctx) => string` | `'You are a helpful assistant.'` | Static or dynamic system prompt |
| `tools` | `ToolDefinition[]` | `[]` | Tools available at construction |
| `memory` | `'kv' \| 'd1' \| 'none'` | `'kv'` | Memory backend |
| `maxIterations` | `number` | `10` | Max agent loop iterations |
| `maxMessages` | `number` | `100` | Max messages loaded from memory per turn |

**Methods:**

```typescript
agent.use(...tools: ToolDefinition[]): this   // add tools (chainable)
agent.run(input: string, ctx: AgentContext): Promise<AgentResult>
```

### `tool()`

Helper to define a typed tool with schema and execute function:

```typescript
const myTool = tool({
  schema: {
    name: 'search_web',
    description: 'Search the web for information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  execute: async ({ query }, ctx) => {
    // ctx.env has your Cloudflare bindings
    return `Results for: ${query}`;
  },
});
```

### `AgentLoop`

Lower-level class if you need direct control. The loop:
1. Sends the message to the LLM
2. If the response contains tool calls, executes them all in **parallel** via `Promise.allSettled`
3. If a tool fails, passes the error back to the LLM (allowing recovery) instead of stopping
4. Repeats until the LLM returns a text response or `maxIterations` is reached

## Dynamic System Prompt

```typescript
const agent = new Agent({
  name: 'greeter',
  model: { provider: 'openai', model: 'gpt-4o-mini' },
  systemPrompt: async (ctx) => {
    const user = await getUser(ctx.userId, ctx.env);
    return `You are helping ${user.name}. Their preferences: ${user.prefs}`;
  },
});
```

## License

MIT
