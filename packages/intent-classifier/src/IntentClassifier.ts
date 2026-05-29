import type { Message } from '@moon-wave/types';
import type {
  IntentClassifierConfig,
  IntentClassificationResult,
  IntentScores,
  IntentType,
} from './types';

const SYSTEM_PROMPT = `You are an intent classifier for a conversational AI system. \
Classify the user message into exactly one of these three intents:

- chitchat: Short social messages, greetings (hi, hello, xin chào), thank you, \
goodbye, casual small talk. No information request, purely social/phatic.
- faq: Questions or requests seeking specific information, product/service inquiries, \
how-to questions, factual lookups, troubleshooting, task-oriented requests.
- fallback: Unclear messages, incomplete sentences, gibberish, typos that make meaning \
unrecoverable, mixed or contradictory intent, or insufficient context to determine purpose.

Score each intent from 0.0 to 1.0 (scores do not need to sum to 1.0).

Return ONLY a valid JSON object in this exact format — no markdown, no explanation:
{"faq": 0.0, "chitchat": 0.0, "fallback": 0.0}

Examples:
Input: "Xin chào bạn!" → {"faq": 0.02, "chitchat": 0.96, "fallback": 0.02}
Input: "Giờ làm việc của shop là mấy giờ?" → {"faq": 0.92, "chitchat": 0.04, "fallback": 0.04}
Input: "asdf ??? jjj" → {"faq": 0.0, "chitchat": 0.0, "fallback": 1.0}`;

function defaultLogger(result: IntentClassificationResult): void {
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'intent_classified',
      intent: result.intent,
      confidence: result.confidence,
      scores: result.scores,
      input: result.input,
      context: result.context,
      timestamp: result.timestamp,
    }),
  );
}

export class IntentClassifier {
  private logger: (result: IntentClassificationResult) => void | Promise<void>;
  private maxRetries: number;
  private minConfidence: number;

  constructor(private config: IntentClassifierConfig) {
    this.logger = config.logger ?? defaultLogger;
    this.maxRetries = config.maxRetries ?? 1;
    this.minConfidence = config.minConfidence ?? 0;
  }

  async classify(input: string, context?: string): Promise<IntentClassificationResult> {
    const userContent = context
      ? `User message: ${input}\nConversation context: ${context}`
      : `User message: ${input}`;

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ];

    let scores: IntentScores | null = null;
    let attempts = 0;

    while (attempts <= this.maxRetries) {
      const response = await this.config.provider.chat(messages);
      scores = this.parseScores(response.content ?? '');
      if (scores !== null) break;
      attempts++;
    }

    // All attempts failed — treat as unclassifiable
    if (scores === null) {
      scores = { faq: 0, chitchat: 0, fallback: 1 };
    }

    let intent = this.pickWinner(scores);

    // Override to fallback when no intent is confident enough
    if (this.minConfidence > 0 && scores[intent] < this.minConfidence) {
      intent = 'fallback';
    }

    const result: IntentClassificationResult = {
      intent,
      scores,
      confidence: scores[intent],
      input,
      context,
      timestamp: new Date().toISOString(),
    };

    await this.logger(result);

    return result;
  }

  private parseScores(raw: string): IntentScores | null {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, number>;
      if (
        typeof parsed['faq'] !== 'number' ||
        typeof parsed['chitchat'] !== 'number' ||
        typeof parsed['fallback'] !== 'number'
      ) {
        return null;
      }
      return {
        faq: this.clamp(parsed['faq']),
        chitchat: this.clamp(parsed['chitchat']),
        fallback: this.clamp(parsed['fallback']),
      };
    } catch {
      return null;
    }
  }

  private pickWinner(scores: IntentScores): IntentType {
    const entries = Object.entries(scores) as [IntentType, number][];
    return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
  }

  private clamp(n: number): number {
    return Math.max(0, Math.min(1, n));
  }
}
