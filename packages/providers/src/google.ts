import type { Message, LLMResponse, ToolSchema } from '@moon-wave/types';
import { BaseProvider, type RawToolCall } from './base';

export interface GoogleConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

// Google AI Studio supports OpenAI-compatible endpoint
// https://ai.google.dev/api/openai
const GOOGLE_OPENAI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';

export class GoogleProvider extends BaseProvider {
  private baseUrl: string;

  constructor(private config: GoogleConfig) {
    super();
    this.baseUrl = config.baseUrl ?? GOOGLE_OPENAI_BASE;
  }

  async chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse> {
    const res = await this.fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        ...(tools?.length && {
          tools: this.toOpenAITools(tools),
          tool_choice: 'auto',
        }),
      }),
    });

    if (!res.ok) throw new Error(`Google AI error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as {
      choices: Array<{ message: { content?: string; tool_calls?: unknown[] } }>;
    };
    const msg = data.choices[0].message;

    if (msg.tool_calls?.length) {
      return this.normalizeToolCalls(msg.tool_calls as RawToolCall[]);
    }
    return { type: 'text', content: msg.content ?? '' };
  }

  override stream(messages: Message[]): ReadableStream<string> {
    const { apiKey, model } = this.config;
    const baseUrl = this.baseUrl;

    return new ReadableStream({
      async start(controller) {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages, stream: true }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') { controller.close(); return; }
            try {
              const delta = (JSON.parse(json) as { choices: Array<{ delta: { content?: string } }> })
                .choices[0].delta.content;
              if (delta) controller.enqueue(delta);
            } catch { /* skip */ }
          }
        }
        controller.close();
      },
    });
  }
}
