---
title: Agent API
description: API reference đầy đủ cho class Agent
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
  maxIterations?: number; // mặc định: 10
}

interface ModelConfig {
  provider: 'groq' | 'google' | 'cerebras' | 'workersai' | 'ollama';
  model: string;
}
```

## Methods

### `agent.use(...tools)`

Đăng ký tools vào agent. Trả về `this` để chain.

```typescript
agent.use(searchTool, calculatorTool);
```

### `agent.run(input, ctx)`

Chạy agent và trả về kết quả.

```typescript
const result = await agent.run('Thời tiết hôm nay thế nào?', {
  sessionId: 'user-123',
  env,
});
// result: { output: string, iterations: number, toolCalls: ToolCall[] }
```

### `agent.stream(messages, ctx)`

Stream phản hồi dưới dạng `ReadableStream<string>`.

```typescript
const stream = agent.stream(messages, ctx);
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' },
});
```

## `AgentContext`

```typescript
interface AgentContext {
  sessionId: string;
  userId?: string;
  env: Record<string, unknown>; // Cloudflare env bindings
  metadata?: Record<string, unknown>;
}
```

## `tool(definition)`

Helper để định nghĩa tool type-safe:

```typescript
import { tool } from '@moon-wave/core';

const myTool = tool({
  name: 'my_tool',
  description: 'Làm gì đó hữu ích',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' },
    },
    required: ['input'],
  },
  execute: async (args, ctx) => {
    return `Đã xử lý: ${args.input}`;
  },
});
```
