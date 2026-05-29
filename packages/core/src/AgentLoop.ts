import type { Message, AgentContext, AgentResult, LLMProvider } from '@moon-wave/types';
import type { MemoryManager } from '@moon-wave/memory';
import type { SafetyLayer } from '@moon-wave/safety';
import type { ToolRegistry } from './tool';

interface LoopConfig {
  agentName: string;
  systemPrompt: string;
  provider: LLMProvider;
  memory: MemoryManager;
  tools: ToolRegistry;
  maxIterations: number;
  safety?: SafetyLayer;
}

export class AgentLoop {
  constructor(private config: LoopConfig) {}

  async run(userMessage: string, ctx: AgentContext): Promise<AgentResult> {
    const { provider, memory, tools, maxIterations } = this.config;
    const toolCallLog: AgentResult['toolCalls'] = [];

    await memory.addMessage(ctx.sessionId, { role: 'user', content: userMessage });

    if (this.config.safety) {
      await this.config.safety.checkInput(userMessage, this.config.agentName, ctx);
    }

    const systemMessage: Message = { role: 'system', content: this.config.systemPrompt };
    const userMsg: Message = { role: 'user', content: userMessage };

    // Fetch history once before the loop to avoid N+1 KV reads (one per iteration).
    // New messages are appended to the local array and persisted via memory.addMessage.
    const history = await memory.getMessages(ctx.sessionId);
    const messages: Message[] = [systemMessage, ...(history.length > 0 ? history : [userMsg])];
    const toolSchemas = tools.getSchemas();

    for (let i = 0; i < maxIterations; i++) {
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

          const toolMsg: Message = { role: 'tool', content: JSON.stringify(result), toolCallId: tc.id };
          messages.push(toolMsg);
          await memory.addMessage(ctx.sessionId, toolMsg);
        }

        // Let the LLM see all tool results and decide how to proceed (including recovering from errors)
        continue;
      }

      let finalContent = response.content ?? '';
      if (this.config.safety) {
        finalContent = await this.config.safety.checkOutput(finalContent, this.config.agentName, ctx);
      }
      const assistantMsg: Message = { role: 'assistant', content: finalContent };
      messages.push(assistantMsg);
      await memory.addMessage(ctx.sessionId, assistantMsg);

      return { output: finalContent, iterations: i + 1, toolCalls: toolCallLog };
    }

    throw new Error(
      `Agent "${this.config.agentName}" exceeded max iterations (${maxIterations}). ` +
        `Tools called: ${toolCallLog.map((t) => t.name).join(', ')}`,
    );
  }
}
