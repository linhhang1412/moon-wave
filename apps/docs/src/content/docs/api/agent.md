---
title: Agent API
description: Complete API reference for the Agent class
---

## `new Agent(config)`

```typescript
import { Agent } from '@moon-wave/core';

const agent = new Agent(config: AgentConfig);
```

### `AgentConfig`

```typescript
interface AgentConfig {
  name: string;
  model: ModelConfig;
  systemPrompt?: string | ((ctx: AgentContext) => string);
  tools?: ToolDefinition[];
  memory?: MemoryConfig;
  maxIterations?: number; // default: 10
}

interface ModelConfig {
  provider: 'groq' | 'google' | 'cerebras' | 'workersai' | 'ollama';
  model: string;
}
```

## Methods

### `agent.use(...tools)`

Register tools on the agent. Returns `this` for chaining.

```typescript
agent.use(searchTool, calculatorTool);
```

### `agent.run(input, ctx)`

Run the agent and return a result.

```typescript
const result = await agent.run('What is the weather?', {
  sessionId: 'user-123',
  env,
});

// result: { output: string, iterations: number, toolCalls: ToolCall[] }
```

### `agent.stream(messages, ctx)`

Stream the response as a `ReadableStream<string>`.

```typescript
const stream = agent.stream(messages, ctx);
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' },
});
```

## `AgentContext`

Passed to `run()` and `stream()` and available inside tool `execute()`.

```typescript
interface AgentContext {
  sessionId: string;
  userId?: string;
  env: Record<string, unknown>; // your Cloudflare env bindings
  metadata?: Record<string, unknown>;
}
```

## `AgentResult`

```typescript
interface AgentResult {
  output: string;
  iterations: number;
  toolCalls: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
}
```

## `tool(definition)`

Helper to define a type-safe tool:

```typescript
import { tool } from '@moon-wave/core';

const myTool = tool({
  name: 'my_tool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' },
    },
    required: ['input'],
  },
  execute: async (args, ctx) => {
    return `Processed: ${args.input}`;
  },
});
```
