import type { ToolDefinition, ToolSchema, AgentContext } from '@moon-wave/types';

export function tool<TArgs, TResult>(
  definition: ToolDefinition<TArgs, TResult>,
): ToolDefinition<TArgs, TResult> {
  return definition;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(definition: ToolDefinition): this {
    this.tools.set(definition.schema.name, definition);
    return this;
  }

  registerMany(definitions: ToolDefinition[]): this {
    definitions.forEach((d) => this.register(d));
    return this;
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getSchemas(): ToolSchema[] {
    return [...this.tools.values()].map((t) => t.schema);
  }

  async execute(name: string, args: Record<string, unknown>, ctx: AgentContext): Promise<unknown> {
    const toolDef = this.tools.get(name);
    if (!toolDef) throw new Error(`Tool "${name}" not found in registry`);
    return toolDef.execute(args, ctx);
  }
}
