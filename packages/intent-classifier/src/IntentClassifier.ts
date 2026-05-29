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
{"faq": 0.0, "chitchat": 0.0, "fallback": 0.0}`;

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

  constructor(private config: IntentClassifierConfig) {
    this.logger = config.logger ?? defaultLogger;
  }

  async classify(input: string, context?: string): Promise<IntentClassificationResult> {
    const userContent = context
      ? `User message: ${input}\nConversation context: ${context}`
      : `User message: ${input}`;

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ];

    const response = await this.config.provider.chat(messages);
    const scores = this.parseScores(response.content ?? '');
    const intent = this.pickWinner(scores);

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

  private parseScores(raw: string): IntentScores {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error('no JSON block in response');
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, number>;
      return {
        faq: this.clamp(Number(parsed['faq'] ?? 0)),
        chitchat: this.clamp(Number(parsed['chitchat'] ?? 0)),
        fallback: this.clamp(Number(parsed['fallback'] ?? 0)),
      };
    } catch {
      // LLM returned unparseable output — treat as fallback
      return { faq: 0, chitchat: 0, fallback: 1 };
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
