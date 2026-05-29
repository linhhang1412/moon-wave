import type { ToolDefinition } from './tool';

export type ProviderName = 'workersai' | 'groq' | 'ollama' | 'google' | 'cerebras' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ProviderName;
  model: string;
}

// ─── Safety types ─────────────────────────────────────────────────────────────

export type SafetyAction = 'pass' | 'flag' | 'block';
export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';
export type SafetyPhase = 'input' | 'output';

export interface SafetyDecision {
  action: SafetyAction;
  guardrail: string;
  reason: string;
  severity: SafetySeverity;
}

export interface GuardrailContext {
  phase: SafetyPhase;
  content: string;
  agentName: string;
  agentCtx: AgentContext;
}

export type Guardrail = (ctx: GuardrailContext) => SafetyDecision | null | Promise<SafetyDecision | null>;

export interface SafetyEvent {
  eventId: string;
  traceId?: string;
  agentName: string;
  sessionId: string;
  userId?: string;
  phase: SafetyPhase;
  action: SafetyAction;
  guardrail: string;
  reason: string;
  severity: SafetySeverity;
  contentSnippet: string;
  timestamp: string;
}

export interface SafetyConfig {
  builtins?: Array<'hate-speech' | 'violence' | 'adult-content' | 'self-harm' | 'illegal-activity' | 'prompt-injection' | 'input-length'>;
  guardrails?: Guardrail[];
  blocklist?: string[];
  allowedTopics?: string[];
  fallbackMessage?: string;
  onEvent?: (event: SafetyEvent) => void | Promise<void>;
  disabled?: boolean;
}

// ─── Agent config ─────────────────────────────────────────────────────────────

export interface AgentConfig {
  name: string;
  model: ModelConfig;
  systemPrompt?: string | ((ctx: AgentContext) => string | Promise<string>);
  tools?: ToolDefinition[];
  memory?: 'kv' | 'd1' | 'none';
  maxIterations?: number;
  maxMessages?: number;
  safety?: SafetyConfig;
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

export interface AgentPublicConfig {
  name: string;
  model: { provider: string; model: string };
  memory: string;
  tools: Array<{ name: string; description: string }>;
  systemPrompt: string;
  maxIterations: number;
}
