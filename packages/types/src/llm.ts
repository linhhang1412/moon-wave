// Minimal Cloudflare AI binding — avoids runtime dep on @cloudflare/workers-types
export interface AiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  role: Role;
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface LLMResponse {
  type: 'text' | 'tool_call';
  content?: string;
  toolCall?: ToolCall;
}

export interface LLMProvider {
  chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse>;
  stream(messages: Message[], tools?: ToolSchema[]): ReadableStream<string>;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
