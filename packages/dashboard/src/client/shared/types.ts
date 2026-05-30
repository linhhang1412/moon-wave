export interface AgentData {
  name: string;
  description?: string;
  model?: string;
  provider?: string;
  tools?: number;
}

export interface RunResult {
  output: string;
  iterations?: number;
  toolCalls?: ToolCallData[];
  error?: string;
}

export interface ToolCallData {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface Message {
  role: 'user' | 'assistant' | 'tool';
  body: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  ts?: number;
  loading?: boolean;
  error?: boolean;
}

export type SectionId =
  | 'mount' | 'overview' | 'playground' | 'logs' | 'sessions' | 'errors'
  | 'agents' | 'tools' | 'mcp' | 'memory' | 'workflows' | 'networks'
  | 'channels' | 'rollouts' | 'evals' | 'cost' | 'alerts' | 'health'
  | 'audit' | 'routes' | 'env' | 'apiref';

export interface SectionMeta {
  group: string;
  hideMainHead?: boolean;
}

export type TweakValues = {
  accent: string;
  fontPair: string;
  density: 'compact' | 'regular' | 'comfy';
  layout: 'sidebar' | 'top';
  dark: boolean;
  lang: 'en' | 'vi';
};
