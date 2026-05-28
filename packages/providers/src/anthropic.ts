import type { Message, LLMResponse, ToolSchema, ToolCall } from '@moon-wave/types';
import { BaseProvider } from './base';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

type AnthropicContentBlock = AnthropicToolUse | AnthropicTextBlock;

export class AnthropicProvider extends BaseProvider {
  constructor(private config: AnthropicConfig) {
    super();
  }

  async chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse> {
    // Anthropic separates system prompt from messages
    const systemMsg = messages.find((m) => m.role === 'system');
    const conversationMsgs = this.mapMessages(messages.filter((m) => m.role !== 'system'));

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: 4096,
      messages: conversationMsgs,
      ...(systemMsg && { system: systemMsg.content }),
      ...(tools?.length && { tools: this.toAnthropicTools(tools) }),
    };

    const res = await this.fetch(`${ANTHROPIC_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { content: AnthropicContentBlock[] };
    const toolUses = data.content.filter((b): b is AnthropicToolUse => b.type === 'tool_use');

    if (toolUses.length > 0) {
      const toolCalls: ToolCall[] = toolUses.map((tc) => ({
        id: tc.id,
        name: tc.name,
        args: tc.input,
      }));
      return { type: 'tool_call', toolCalls };
    }

    const textBlock = data.content.find((b): b is AnthropicTextBlock => b.type === 'text');
    return { type: 'text', content: textBlock?.text ?? '' };
  }

  private mapMessages(messages: Message[]): unknown[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }],
        };
      }
      return { role: m.role, content: m.content };
    });
  }

  private toAnthropicTools(tools: ToolSchema[]) {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }
}
