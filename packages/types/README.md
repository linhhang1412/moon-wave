# @moon-wave/types

Core TypeScript type definitions for the moon-wave AI agent framework.

## Installation

```bash
npm install @moon-wave/types
```

## Overview

This package exports all shared interfaces used across the moon-wave ecosystem. You typically don't install it directly — it is a peer dependency of other packages.

## Key Types

### Agent

```typescript
import type { AgentConfig, AgentContext, AgentResult } from '@moon-wave/types';

interface AgentConfig {
  name: string;
  model: ModelConfig;              // { provider, model }
  systemPrompt?: string | ((ctx: AgentContext) => string | Promise<string>);
  tools?: ToolDefinition[];
  memory?: 'kv' | 'd1' | 'none';  // default: 'kv'
  maxIterations?: number;          // default: 10
  maxMessages?: number;            // context window limit
}

interface AgentContext {
  sessionId: string;
  userId?: string;
  env: Record<string, unknown>;    // Cloudflare Workers env bindings
  metadata?: Record<string, unknown>;
}

interface AgentResult {
  output: string;
  iterations: number;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
}
```

### LLM

```typescript
import type { LLMProvider, LLMResponse, Message, ToolSchema } from '@moon-wave/types';

type ProviderName = 'workersai' | 'groq' | 'ollama' | 'google' | 'cerebras' | 'openai' | 'anthropic';

interface LLMResponse {
  type: 'text' | 'tool_call';
  content?: string;
  toolCalls?: ToolCall[];          // one LLM response can request multiple tools
}
```

### Memory

```typescript
import type { MemoryAdapter, VectorAdapter } from '@moon-wave/types';

interface MemoryAdapter {
  getMessages(sessionId: string, limit?: number): Promise<Message[]>;
  addMessage(sessionId: string, message: Message): Promise<void>;
  clearSession(sessionId: string): Promise<void>;
}
```

### Tools

```typescript
import type { ToolDefinition, ToolSchema } from '@moon-wave/types';

interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  schema: ToolSchema;
  execute(args: TArgs, ctx: AgentContext): Promise<TResult>;
}
```

## License

MIT
