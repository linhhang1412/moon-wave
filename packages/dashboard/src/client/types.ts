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
  durationMs?: number;
  error?: string;
}

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  iterations?: number;
  durationMs?: number;
  toolCalls?: ToolCallData[];
  error?: boolean;
}

export interface AppendMessageOptions {
  isError?: boolean;
  isLoading?: boolean;
  iterations?: number;
  durationMs?: number;
}

export interface TraceRecord {
  id: string;
  agentName: string;
  input: string;
  output: string;
  iterations: number;
  durationMs: number;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
  timestamp: string;
  error?: string;
}

export interface SessionRecord {
  sessionId: string;
  messageCount: number;
  lastActivity: string;
}

export interface AgentPublicConfig {
  name: string;
  model: { provider: string; model: string };
  memory: string;
  tools: Array<{ name: string; description: string }>;
  systemPrompt: string;
  maxIterations: number;
}

export interface MetricsData {
  requestCount: number;
  errorCount: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  toolCallRate: number;
  errorRate: number;
}

export interface ReBACUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ReBACTupleRecord {
  id: number;
  objectType: string;
  objectId: string;
  relation: string;
  subjectType: string;
  subjectId: string;
  subjectRelation?: string;
  createdAt: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
}
