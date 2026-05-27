import type { Message, LLMResponse, ToolSchema } from '@moon-wave/types';
import { BaseProvider } from './base';

export interface CerebrasConfig {
  apiKey: string;
  model: string;
}

// Cerebras Cloud uses OpenAI-compatible API
// https://inference-docs.cerebras.ai/api-reference
const CEREBRAS_BASE = 'https://api.cerebras.ai/v1';

export class CerebrasProvider extends BaseProvider {
  constructor(private config: CerebrasConfig) {
    super();
  }

  async chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse> {
    const res = await fetch(`${CEREBRAS_BASE}/chat/completions`, {
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

    if (!res.ok) {
      throw new Error(`Cerebras error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content?: string; tool_calls?: unknown[] } }>;
    };
    const msg = data.choices[0].message;

    if (msg.tool_calls?.[0]) {
      return this.normalizeToolCall(msg.tool_calls[0] as never);
    }
    return { type: 'text', content: msg.content ?? '' };
  }

  override stream(messages: Message[]): ReadableStream<string> {
    const { apiKey, model } = this.config;

    return new ReadableStream({
      async start(controller) {
        const res = await fetch(`${CEREBRAS_BASE}/chat/completions`, {
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
