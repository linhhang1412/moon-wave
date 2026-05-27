---
title: Workflow API
description: API reference for the graph-based workflow engine
---

## `Graph`

Define a directed acyclic graph of workflow steps.

```typescript
import { Graph } from '@moon-wave/workflow';

const graph = new Graph()
  .step({
    name: 'fetch-data',
    execute: async (ctx) => {
      const data = await fetchSomeData();
      return data;
    },
    next: (result) => result ? 'process' : 'error',
  })
  .step({
    name: 'process',
    execute: async (ctx) => {
      const data = ctx.get<MyData>('fetch-data');
      return transform(data);
    },
  })
  .step({
    name: 'error',
    execute: async () => ({ error: 'No data found' }),
  })
  .start('fetch-data');
```

### `StepDefinition`

```typescript
interface StepDefinition<TOutput = unknown> {
  name: string;
  execute(ctx: WorkflowContext): Promise<TOutput>;
  next?(result: TOutput, ctx: WorkflowContext): string | null;
}
```

`next()` returns the name of the next step, or `null` to end the workflow.

## `WorkflowEngine`

Runs a graph:

```typescript
import { WorkflowEngine } from '@moon-wave/workflow';

const engine = new WorkflowEngine(graph, maxSteps: 50);
const result = await engine.run(input, agentCtx);
```

### `WorkflowResult`

```typescript
interface WorkflowResult {
  output: unknown;
  steps: Array<{
    name: string;
    result: unknown;
    durationMs: number;
  }>;
  totalDurationMs: number;
}
```

## `WorkflowContext`

Available inside each step's `execute()`:

```typescript
class WorkflowContext {
  // Get the result of a previous step
  get<T>(stepName: string): T | undefined

  // Get the most recent step result
  getLast<T>(): T | undefined

  // Get all step results
  getAll(): Record<string, unknown>

  // The original AgentContext (has env, sessionId, etc.)
  agentCtx: AgentContext

  // The workflow's initial input
  input: unknown
}
```
