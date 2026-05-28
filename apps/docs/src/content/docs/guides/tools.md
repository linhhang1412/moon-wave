---
title: Using Tools
description: Give your agent the ability to call functions
---

Tools let your agent take actions — search the web, call APIs, read files, and more.

## Define a tool

```typescript
import { tool } from '@moon-wave/core';

const getCurrentTime = tool({
  schema: {
    name: 'get_current_time',
    description: 'Returns the current UTC time',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone, e.g. "Asia/Ho_Chi_Minh"',
        },
      },
      required: [],
    },
  },
  execute: async (args) => {
    const tz = (args.timezone as string) ?? 'UTC';
    return new Date().toLocaleString('en-US', { timeZone: tz });
  },
});
```

## Register tools on the agent

```typescript
const agent = new Agent({
  name: 'my-agent',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful assistant.',
});

agent.use(getCurrentTime);

// Or chain multiple tools
agent.use(getCurrentTime, searchWeb, readFile);
```

## How tools work

1. The agent sends tool schemas to the LLM with each message
2. The LLM decides whether to call a tool or respond directly
3. If a tool is called, `execute()` runs and the result is sent back to the LLM
4. The loop repeats until the LLM produces a final text response

The agent loop respects `maxIterations` (default: 10) to prevent infinite loops.

## Tool parameters

Parameters follow [JSON Schema](https://json-schema.org/) format:

```typescript
const lookupUser = tool({
  schema: {
    name: 'lookup_user',
    description: 'Fetch user details by ID',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user ID' },
        includeEmail: { type: 'boolean', description: 'Include email in response' },
      },
      required: ['userId'],
    },
  },
  execute: async (args, ctx) => {
    const { userId, includeEmail } = args as { userId: string; includeEmail?: boolean };
    // ctx.env has your Cloudflare bindings
    const user = await ctx.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();
    return includeEmail ? user : { ...user, email: undefined };
  },
});
```

## Accessing Cloudflare bindings in tools

The `ctx` (AgentContext) is passed as the second argument to `execute`:

```typescript
execute: async (args, ctx) => {
  // Access KV, D1, R2, etc.
  const value = await ctx.env.MY_KV.get('some-key');
  return value;
}
```
