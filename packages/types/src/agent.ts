import type { ToolDefinition } from './tool';

export type ProviderName = 'workersai' | 'groq' | 'ollama' | 'google' | 'cerebras' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ProviderName;
  model: string;
}

export interface AgentConfig {
  name: string;
  model: ModelConfig;
  systemPrompt?: string | ((ctx: AgentContext) => string | Promise<string>);
  tools?: ToolDefinition[];
  memory?: 'kv' | 'd1' | 'none';
  maxIterations?: number;
  maxMessages?: number;
}

export interface AgentContext {
  sessionId: string;
  userId?: string;
  env: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AgentResult {
  output: string;
  iterations: number;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
}

export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; name: string; callId: string; args: Record<string, unknown> }
  | { type: 'tool_end'; name: string; callId: string; result: unknown; error?: string }
  | { type: 'usage'; iterations: number; toolCallCount: number };
