# @moon-wave/workflow

Graph-based workflow engine for moon-wave — chain deterministic steps with conditional branching.

## Installation

```bash
npm install @moon-wave/workflow
```

## Quick Start

```typescript
import { Graph, WorkflowEngine } from '@moon-wave/workflow';

const graph = new Graph();

graph
  .step({
    name: 'fetch_data',
    execute: async (ctx) => {
      const raw = ctx.get('input');
      return await fetchFromAPI(raw as string, ctx.agentCtx.env);
    },
    next: () => 'transform',
  })
  .step({
    name: 'transform',
    execute: async (ctx) => {
      const data = ctx.get('fetch_data');
      return JSON.stringify(data, null, 2);
    },
    next: (result) => (result ? 'summarize' : null),  // conditional branch
  })
  .step({
    name: 'summarize',
    execute: async (ctx) => {
      return `Processed: ${ctx.get('transform')}`;
    },
    // no next() = terminal step
  });

const engine = new WorkflowEngine(graph, 20); // maxSteps default: 20

export default {
  async fetch(request: Request, env: Env) {
    const { input, sessionId } = await request.json<{ input: string; sessionId: string }>();
    const result = await engine.run(input, { sessionId, env });
    return Response.json(result);
  },
};
```

## API

### `Graph`

```typescript
graph.step(definition: StepDefinition): this
graph.start(stepName: string): this   // override default start step (first added)
graph.getStep(name: string): StepDefinition | undefined
graph.getStartStep(): string
```

### `StepDefinition`

```typescript
interface StepDefinition<TOutput = unknown> {
  name: string;
  execute(ctx: WorkflowContext): Promise<TOutput>;
  next?(result: TOutput, ctx: WorkflowContext): string | null;  // null = stop
}
```

### `WorkflowContext`

Passed to each step's `execute` function:

```typescript
ctx.get(stepName: string): unknown   // result of a previous step
ctx.getLast(): unknown               // result of the most recent step
ctx.set(stepName: string, value: unknown): void
ctx.agentCtx: AgentContext           // original context (env, sessionId, etc.)
ctx.input: unknown                   // original input passed to engine.run()
```

### `WorkflowResult`

```typescript
interface WorkflowResult {
  output: unknown;    // result of the last step
  steps: Array<{ name: string; result: unknown; durationMs: number }>;
  totalDurationMs: number;
}
```

## Combining with Agents

Each step can run an `Agent`:

```typescript
import { Agent } from '@moon-wave/core';

const summarizer = new Agent({ name: 'summarizer', model: { ... } });

graph.step({
  name: 'summarize',
  execute: async (ctx) => {
    const text = ctx.get('extract') as string;
    const result = await summarizer.run(`Summarize: ${text}`, ctx.agentCtx);
    return result.output;
  },
});
```

## License

MIT
