import type { LLMProvider } from '@moon-wave/types';

export type IntentType = 'faq' | 'chitchat' | 'fallback';

export interface IntentScores {
  faq: number;
  chitchat: number;
  fallback: number;
}

export interface IntentClassificationResult {
  intent: IntentType;
  scores: IntentScores;
  confidence: number;
  input: string;
  context?: string;
  timestamp: string;
}

export interface IntentClassifierConfig {
  provider: LLMProvider;
  logger?: (result: IntentClassificationResult) => void | Promise<void>;
  /** Minimum confidence score for the winning intent. If the winner scores below
   *  this threshold the result is overridden to `fallback`. Default: 0 (disabled). */
  minConfidence?: number;
  /** Number of additional LLM call attempts when the response cannot be parsed
   *  as a valid scores object. Default: 1. */
  maxRetries?: number;
}
