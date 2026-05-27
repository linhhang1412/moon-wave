import type { WorkflowContext } from './WorkflowContext';

export interface StepDefinition<TOutput = unknown> {
  name: string;
  execute(ctx: WorkflowContext): Promise<TOutput>;
  next?(result: TOutput, ctx: WorkflowContext): string | null;
}

export class Graph {
  private steps = new Map<string, StepDefinition>();
  private startStep?: string;

  step<T>(definition: StepDefinition<T>): this {
    this.steps.set(definition.name, definition as StepDefinition);
    return this;
  }

  start(stepName: string): this {
    if (!this.steps.has(stepName)) throw new Error(`Step "${stepName}" not found in graph`);
    this.startStep = stepName;
    return this;
  }

  getStep(name: string): StepDefinition | undefined {
    return this.steps.get(name);
  }

  getStartStep(): string {
    if (this.startStep) return this.startStep;
    const first = this.steps.keys().next().value;
    if (!first) throw new Error('Graph has no steps');
    return first;
  }
}
