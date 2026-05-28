import type { Message, LLMResponse, ToolSchema } from '@moon-wave/types';
import { BaseProvider, type RawToolCall } from './base';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export class OllamaProvider extends BaseProvider {
  constructor(private config: OllamaConfig) {
    super();
  }

  async chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse> {
    const res = await this.fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false,
        ...(tools?.length && { tools: this.toOpenAITools(tools) }),
      }),
    });

    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as {
      message: { content?: string; tool_calls?: unknown[] };
    };

    if (data.message.tool_calls?.length) {
      return this.normalizeToolCalls(data.message.tool_calls as RawToolCall[]);
    }
    return { type: 'text', content: data.message.content ?? '' };
  }
}
