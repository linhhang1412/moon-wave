import type { AgentConfig, AgentContext, AgentResult, LLMProvider, ToolDefinition } from '@moon-wave/types';
import { LLMRouter } from '@moon-wave/providers';
import { MemoryManager, KVMemoryAdapter, D1MemoryAdapter } from '@moon-wave/memory';
import { ToolRegistry, tool } from './tool';
import { AgentLoop } from './AgentLoop';

export { tool };

export class Agent {
  readonly name: string;
  private registry = new ToolRegistry();

  constructor(private config: AgentConfig) {
    this.name = config.name;
    if (config.tools?.length) this.registry.registerMany(config.tools);
  }

  use(...tools: ToolDefinition[]): this {
    this.registry.registerMany(tools);
    return this;
  }

  private buildProvider(env: Record<string, unknown>): LLMProvider {
    const { provider, model } = this.config.model;
    const router = new LLMRouter();

    switch (provider) {
      case 'groq':
        router.register('groq', { apiKey: env.GROQ_API_KEY as string, model });
        break;
      case 'workersai':
        router.register('workersai', { ai: env.AI as never, model });
        break;
      case 'ollama':
        router.register('ollama', { baseUrl: env.OLLAMA_BASE_URL as string, model });
        break;
      case 'google':
        router.register('google', { apiKey: env.GOOGLE_API_KEY as string, model });
        break;
      case 'cerebras':
        router.register('cerebras', { apiKey: env.CEREBRAS_API_KEY as string, model });
        break;
      case 'openai':
        router.register('openai', { apiKey: env.OPENAI_API_KEY as string, model });
        break;
      case 'anthropic':
        router.register('anthropic', { apiKey: env.ANTHROPIC_API_KEY as string, model });
        break;
    }

    return router.get(provider);
  }

  private buildMemory(env: Record<string, unknown>): MemoryManager {
    const type = this.config.memory ?? 'kv';
    return new MemoryManager({
      shortTerm: type !== 'none' ? new KVMemoryAdapter(env.KV as never) : undefined,
      longTerm: type === 'd1' ? new D1MemoryAdapter(env.DB as never) : undefined,
      maxMessages: this.config.maxMessages,
    });
  }

  private async getSystemPrompt(ctx: AgentContext): Promise<string> {
    const { systemPrompt } = this.config;
    if (!systemPrompt) return 'You are a helpful assistant.';
    if (typeof systemPrompt === 'function') return systemPrompt(ctx);
    return systemPrompt;
  }

  async run(input: string, ctx: AgentContext): Promise<AgentResult> {
    const provider = this.buildProvider(ctx.env);
    const memory = this.buildMemory(ctx.env);
    const systemPrompt = await this.getSystemPrompt(ctx);

    const loop = new AgentLoop({
      agentName: this.name,
      systemPrompt,
      provider,
      memory,
      tools: this.registry,
      maxIterations: this.config.maxIterations ?? 10,
    });

    return loop.run(input, ctx);
  }
}
