import type {
  AgentContext,
  SafetyConfig,
  SafetyDecision,
  SafetyEvent,
  SafetyPhase,
  Guardrail,
  GuardrailContext,
} from '@moon-wave/types';
import { builtinGuardrails } from './builtins/index';

const DEFAULT_FALLBACK = "I'm sorry, I can't help with that. Please try a different question.";

const ALL_BUILTINS = [
  'hate-speech',
  'violence',
  'adult-content',
  'self-harm',
  'illegal-activity',
  'prompt-injection',
  'input-length',
] as const;

export class SafetyBlockedError extends Error {
  constructor(
    public readonly decision: SafetyDecision,
    public readonly event: SafetyEvent,
  ) {
    super(`[safety] Input blocked by "${decision.guardrail}": ${decision.reason}`);
    this.name = 'SafetyBlockedError';
  }
}

export class SafetyLayer {
  private chain: Guardrail[];
  private fallbackMessage: string;

  constructor(private config: SafetyConfig) {
    const enabledBuiltins = config.builtins ?? [...ALL_BUILTINS];
    const resolvedBuiltins = enabledBuiltins
      .map((name) => builtinGuardrails[name])
      .filter(Boolean) as Guardrail[];

    const blocklistGuardrail = config.blocklist?.length
      ? buildBlocklistGuardrail(config.blocklist)
      : null;

    const topicsGuardrail = config.allowedTopics?.length
      ? buildTopicsGuardrail(config.allowedTopics)
      : null;

    this.chain = [
      ...resolvedBuiltins,
      ...(blocklistGuardrail ? [blocklistGuardrail] : []),
      ...(topicsGuardrail ? [topicsGuardrail] : []),
      ...(config.guardrails ?? []),
    ];

    this.fallbackMessage = config.fallbackMessage ?? DEFAULT_FALLBACK;
  }

  async checkInput(content: string, agentName: string, agentCtx: AgentContext): Promise<void> {
    if (this.config.disabled) return;
    const decision = await this.runChain('input', content, agentName, agentCtx);
    if (decision?.action === 'block') {
      const event = this.buildEvent('input', decision, content, agentName, agentCtx);
      this.emitEvent(event);
      throw new SafetyBlockedError(decision, event);
    }
  }

  async checkOutput(content: string, agentName: string, agentCtx: AgentContext): Promise<string> {
    if (this.config.disabled) return content;
    const decision = await this.runChain('output', content, agentName, agentCtx);
    if (decision?.action === 'block') {
      const event = this.buildEvent('output', decision, content, agentName, agentCtx);
      this.emitEvent(event);
      return this.fallbackMessage;
    }
    return content;
  }

  private async runChain(
    phase: SafetyPhase,
    content: string,
    agentName: string,
    agentCtx: AgentContext,
  ): Promise<SafetyDecision | null> {
    const gCtx: GuardrailContext = { phase, content, agentName, agentCtx };

    for (const guardrail of this.chain) {
      const decision = await guardrail(gCtx);
      if (!decision) continue;

      if (decision.action === 'flag') {
        const event = this.buildEvent(phase, decision, content, agentName, agentCtx);
        this.emitEvent(event);
        continue;
      }

      if (decision.action === 'block') return decision;
    }
    return null;
  }

  private buildEvent(
    phase: SafetyPhase,
    decision: SafetyDecision,
    content: string,
    agentName: string,
    agentCtx: AgentContext,
  ): SafetyEvent {
    return {
      eventId: crypto.randomUUID(),
      traceId: agentCtx.metadata?.traceId as string | undefined,
      agentName,
      sessionId: agentCtx.sessionId,
      userId: agentCtx.userId,
      phase,
      action: decision.action,
      guardrail: decision.guardrail,
      reason: decision.reason,
      severity: decision.severity,
      contentSnippet: content.slice(0, 200),
      timestamp: new Date().toISOString(),
    };
  }

  private emitEvent(event: SafetyEvent): void {
    if (!this.config.onEvent) return;
    void Promise.resolve(this.config.onEvent(event)).catch(console.error);
  }
}

function buildBlocklistGuardrail(blocklist: string[]): Guardrail {
  const lower = blocklist.map((w) => w.toLowerCase());
  return ({ content }): SafetyDecision | null => {
    const lc = content.toLowerCase();
    const hit = lower.find((w) => lc.includes(w));
    if (!hit) return null;
    return {
      action: 'block',
      guardrail: 'custom-blocklist',
      reason: 'Content matches a blocked term',
      severity: 'high',
    };
  };
}

function buildTopicsGuardrail(allowedTopics: string[]): Guardrail {
  const lower = allowedTopics.map((t) => t.toLowerCase());
  return ({ content, phase }): SafetyDecision | null => {
    if (phase !== 'output') return null;
    const lc = content.toLowerCase();
    const onTopic = lower.some((t) => lc.includes(t));
    if (onTopic) return null;
    return {
      action: 'flag',
      guardrail: 'allowed-topics',
      reason: 'Response does not appear to address configured topics',
      severity: 'low',
    };
  };
}
