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
}
