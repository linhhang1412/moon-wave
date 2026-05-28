export interface AgentData {
  name: string;
  description?: string;
}

export interface ToolCallData {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AgentRunResult {
  output: string;
  iterations: number;
  toolCalls?: ToolCallData[];
  error?: string;
}

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  iterations?: number;
  toolCalls?: ToolCallData[];
  error?: boolean;
}

export interface AppendMessageOptions {
  isError?: boolean;
  isLoading?: boolean;
  iterations?: number;
}
