import type { Message, LLMResponse, ToolSchema, AiBinding } from '@moon-wave/types';
import { BaseProvider, type RawToolCall } from './base';

export type { AiBinding };

interface WorkersAIChatResponse {
  response?: string;
  tool_calls?: RawToolCall[];
}

export interface WorkersAIConfig {
  ai: AiBinding;
  model: string;
}

export class WorkersAIProvider extends BaseProvider {
  constructor(private config: WorkersAIConfig) {
    super();
  }

  async chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse> {
    const response = (await this.config.ai.run(this.config.model, {
      messages,
      ...(tools?.length && {
        tools: this.toOpenAITools(tools),
      }),
    })) as WorkersAIChatResponse;

    if (response.tool_calls?.length) {
      return this.normalizeToolCalls(response.tool_calls);
    }
    return { type: 'text', content: response.response ?? '' };
  }

  override stream(messages: Message[]): ReadableStream<string> {
    return this.config.ai.run(this.config.model, {
      messages,
      stream: true,
    }) as unknown as ReadableStream<string>;
  }
}
