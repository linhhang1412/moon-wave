import type { AgentContext } from '@moon-wave/types';

export class WorkflowContext {
  private results = new Map<string, unknown>();

  constructor(
    public readonly agentCtx: AgentContext,
    public readonly input: unknown,
    public metadata: Record<string, unknown> = {},
  ) {}

  set(stepName: string, result: unknown): void {
    this.results.set(stepName, result);
  }

  get<T = unknown>(stepName: string): T | undefined {
    return this.results.get(stepName) as T;
  }

  getLast<T = unknown>(): T | undefined {
    const keys = [...this.results.keys()];
    if (!keys.length) return undefined;
    return this.results.get(keys[keys.length - 1]) as T;
  }

  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.results);
  }
}
