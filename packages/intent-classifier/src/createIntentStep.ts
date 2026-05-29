import type { StepDefinition } from '@moon-wave/workflow';
import { IntentClassifier } from './IntentClassifier';
import type { IntentClassificationResult } from './types';

/**
 * Creates a Graph step that classifies the incoming input and routes to
 * the step whose name matches the winning intent: 'faq' | 'chitchat' | 'fallback'.
 *
 * Expected ctx.input shapes:
 *   - string              → used as the user message
 *   - { message: string, context?: string }  → message + optional prior context
 *
 * ctx.agentCtx.metadata.context (string) is used as a fallback context source.
 */
export function createIntentStep(
  classifier: IntentClassifier,
  stepName = 'classify',
): StepDefinition<IntentClassificationResult> {
  return {
    name: stepName,

    async execute(ctx) {
      const raw = ctx.input;

      const input =
        typeof raw === 'string'
          ? raw
          : isMessageObject(raw)
            ? String(raw.message)
            : String(raw);

      const context =
        isMessageObject(raw) && typeof raw.context === 'string'
          ? raw.context
          : typeof ctx.agentCtx.metadata?.context === 'string'
            ? ctx.agentCtx.metadata.context
            : undefined;

      return classifier.classify(input, context);
    },

    next(result) {
      return result.intent;
    },
  };
}

function isMessageObject(v: unknown): v is { message: unknown; context?: unknown } {
  return typeof v === 'object' && v !== null && 'message' in v;
}
