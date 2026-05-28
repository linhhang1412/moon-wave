import type { Message, AgentContext, AgentResult, LLMProvider } from '@moon-wave/types';
import type { MemoryManager } from '@moon-wave/memory';
import type { ToolRegistry } from './tool';

interface LoopConfig {
  agentName: string;
  systemPrompt: string;
  provider: LLMProvider;
  memory: MemoryManager;
  tools: ToolRegistry;
  maxIterations: number;
}

export class AgentLoop {
  constructor(private config: LoopConfig) {}

  async run(userMessage: string, ctx: AgentContext): Promise<AgentResult> {
    const { provider, memory, tools, maxIterations } = this.config;
    const toolCallLog: AgentResult['toolCalls'] = [];

    await memory.addMessage(ctx.sessionId, { role: 'user', content: userMessage });

    const systemMessage: Message = { role: 'system', content: this.config.systemPrompt };
    const userMsg: Message = { role: 'user', content: userMessage };

    for (let i = 0; i < maxIterations; i++) {
      const history = await memory.getMessages(ctx.sessionId);
      // fallback to current message when memory is none (history empty)
      const messages: Message[] = [systemMessage, ...(history.length > 0 ? history : [userMsg])];
      const toolSchemas = tools.getSchemas();

      const response = await provider.chat(messages, toolSchemas);

      if (response.type === 'tool_call' && response.toolCalls?.length) {
        // Execute all tool calls in parallel, collect results regardless of errors
        const settled = await Promise.allSettled(
          response.toolCalls.map((tc) => tools.execute(tc.name, tc.args, ctx)),
        );

        for (let j = 0; j < response.toolCalls.length; j++) {
          const tc = response.toolCalls[j];
          const outcome = settled[j];
          const result = outcome.status === 'fulfilled' ? outcome.value : { error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason) };

          toolCallLog.push({ name: tc.name, args: tc.args, result });

          await memory.addMessage(ctx.sessionId, {
            role: 'tool',
            content: JSON.stringify(result),
            toolCallId: tc.id,
          });
        }

        // Let the LLM see all tool results and decide how to proceed (including recovering from errors)
        continue;
      }

      const finalContent = response.content ?? '';
      await memory.addMessage(ctx.sessionId, { role: 'assistant', content: finalContent });

      return { output: finalContent, iterations: i + 1, toolCalls: toolCallLog };
    }

    throw new Error(
      `Agent "${this.config.agentName}" exceeded max iterations (${maxIterations}). ` +
        `Tools called: ${toolCallLog.map((t) => t.name).join(', ')}`,
    );
  }
}
