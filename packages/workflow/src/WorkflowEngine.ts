import type { AgentContext } from '@moon-wave/types';
import { Graph } from './Graph';
import { WorkflowContext } from './WorkflowContext';

export interface WorkflowResult {
  output: unknown;
  steps: Array<{ name: string; result: unknown; durationMs: number }>;
  totalDurationMs: number;
}

export class WorkflowEngine {
  constructor(
    private graph: Graph,
    private maxSteps = 20,
  ) {}

  async run(input: unknown, agentCtx: AgentContext): Promise<WorkflowResult> {
    const ctx = new WorkflowContext(agentCtx, input);
    const stepLog: WorkflowResult['steps'] = [];
    const startTime = Date.now();

    let currentStepName: string | null = this.graph.getStartStep();
    let stepCount = 0;

    while (currentStepName !== null) {
      if (stepCount >= this.maxSteps) {
        throw new Error(`Workflow exceeded max steps (${this.maxSteps})`);
      }

      const step = this.graph.getStep(currentStepName);
      if (!step) throw new Error(`Step "${currentStepName}" not found`);

      const stepStart = Date.now();
      const result = await step.execute(ctx);
      const durationMs = Date.now() - stepStart;

      ctx.set(currentStepName, result);
      stepLog.push({ name: currentStepName, result, durationMs });
      stepCount++;

      currentStepName = step.next ? step.next(result, ctx) : null;
    }

    return {
      output: ctx.getLast(),
      steps: stepLog,
      totalDurationMs: Date.now() - startTime,
    };
  }
}
