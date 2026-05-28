import type { LLMProvider, Message, LLMResponse, ToolSchema } from '@moon-wave/types';
import { fetchWithRetry } from './retry';

export interface RawToolCall {
  id?: string;
  name?: string;
  function?: { name?: string; arguments?: string | Record<string, unknown> };
  arguments?: Record<string, unknown>;
}

export abstract class BaseProvider implements LLMProvider {
  abstract chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse>;

  /** Default implementation buffers the full chat() response. Override in subclasses for true token-by-token streaming. */
  stream(messages: Message[], tools?: ToolSchema[]): ReadableStream<string> {
    return new ReadableStream({
      start: async (controller) => {
        try {
          const response = await this.chat(messages, tools);
          if (response.content) controller.enqueue(response.content);
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  protected normalizeToolCalls(rawToolCalls: RawToolCall[]): LLMResponse {
    return {
      type: 'tool_call',
      toolCalls: rawToolCalls.map((tc) => {
        const name = tc.function?.name ?? tc.name ?? '';
        const rawArgs = tc.function?.arguments ?? tc.arguments ?? {};
        const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
        return { id: tc.id ?? crypto.randomUUID(), name, args };
      }),
    };
  }

  protected fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    return fetchWithRetry(input, init);
  }

  protected toOpenAITools(tools: ToolSchema[]) {
    return tools.map((t) => ({ type: 'function' as const, function: t }));
  }
}
