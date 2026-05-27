import type { LLMProvider, Message, LLMResponse, ToolSchema } from '@moon-wave/types';

export abstract class BaseProvider implements LLMProvider {
  abstract chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse>;

  stream(messages: Message[], tools?: ToolSchema[]): ReadableStream<string> {
    return new ReadableStream({
      start: async (controller) => {
        const response = await this.chat(messages, tools);
        if (response.content) controller.enqueue(response.content);
        controller.close();
      },
    });
  }

  protected normalizeToolCall(toolCall: {
    id?: string;
    name?: string;
    function?: { name?: string; arguments?: string | Record<string, unknown> };
    arguments?: Record<string, unknown>;
  }): LLMResponse {
    const name = toolCall.function?.name ?? toolCall.name ?? '';
    const rawArgs = toolCall.function?.arguments ?? toolCall.arguments ?? {};
    const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;

    return {
      type: 'tool_call',
      toolCall: {
        id: toolCall.id ?? crypto.randomUUID(),
        name,
        args,
      },
    };
  }

  protected toOpenAITools(tools: ToolSchema[]) {
    return tools.map((t) => ({ type: 'function' as const, function: t }));
  }
}
