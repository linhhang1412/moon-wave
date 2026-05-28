import type { Message, AgentContext, AgentResult, LLMProvider, StreamEvent } from '@moon-wave/types';
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

      const finalContent = response.content ?? '';
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

  stream(userMessage: string, ctx: AgentContext): ReadableStream<StreamEvent> {
    const { readable, writable } = new TransformStream<StreamEvent, StreamEvent>();
    const writer = writable.getWriter();

    this.runStreamInternal(userMessage, ctx, writer).catch((err) => writer.abort(err));

    return readable;
  }

  private async runStreamInternal(
    userMessage: string,
    ctx: AgentContext,
    writer: WritableStreamDefaultWriter<StreamEvent>,
  ): Promise<void> {
    const { provider, memory, tools, maxIterations } = this.config;
    let toolCallCount = 0;

    await memory.addMessage(ctx.sessionId, { role: 'user', content: userMessage });

    const systemMessage: Message = { role: 'system', content: this.config.systemPrompt };
    const userMsg: Message = { role: 'user', content: userMessage };
    const history = await memory.getMessages(ctx.sessionId);
    const messages: Message[] = [systemMessage, ...(history.length > 0 ? history : [userMsg])];
    const toolSchemas = tools.getSchemas();

    for (let i = 0; i < maxIterations; i++) {
      const response = await provider.chat(messages, toolSchemas);

      if (response.type === 'tool_call' && response.toolCalls?.length) {
        for (const tc of response.toolCalls) {
          await writer.write({ type: 'tool_start', name: tc.name, callId: tc.id, args: tc.args });
        }

        const settled = await Promise.allSettled(
          response.toolCalls.map((tc) => tools.execute(tc.name, tc.args, ctx)),
        );

        for (let j = 0; j < response.toolCalls.length; j++) {
          const tc = response.toolCalls[j];
          const outcome = settled[j];

          if (outcome.status === 'fulfilled') {
            await writer.write({ type: 'tool_end', name: tc.name, callId: tc.id, result: outcome.value });
            const toolMsg: Message = { role: 'tool', content: JSON.stringify(outcome.value), toolCallId: tc.id };
            messages.push(toolMsg);
            await memory.addMessage(ctx.sessionId, toolMsg);
          } else {
            const errorMsg = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
            await writer.write({ type: 'tool_end', name: tc.name, callId: tc.id, result: { error: errorMsg }, error: errorMsg });
            const toolMsg: Message = { role: 'tool', content: JSON.stringify({ error: errorMsg }), toolCallId: tc.id };
            messages.push(toolMsg);
            await memory.addMessage(ctx.sessionId, toolMsg);
          }

          toolCallCount++;
        }

        continue;
      }

      const finalContent = response.content ?? '';
      const assistantMsg: Message = { role: 'assistant', content: finalContent };
      messages.push(assistantMsg);
      await memory.addMessage(ctx.sessionId, assistantMsg);

      await writer.write({ type: 'text', text: finalContent });
      await writer.write({ type: 'usage', iterations: i + 1, toolCallCount });
      await writer.close();
      return;
    }

    throw new Error(
      `Agent "${this.config.agentName}" exceeded max iterations (${maxIterations}). ` +
        `Tool calls made: ${toolCallCount}`,
    );
  }
}
