---
title: Workflow API
description: API reference cho graph-based workflow engine
---

## `Graph`

Định nghĩa DAG các bước workflow:

```typescript
import { Graph } from '@moon-wave/workflow';

const graph = new Graph()
  .step({
    name: 'fetch-data',
    execute: async (ctx) => {
      return await fetchSomeData();
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
  .start('fetch-data');
```

`next()` trả về tên bước tiếp theo, hoặc `null` để kết thúc workflow.

## `WorkflowEngine`

```typescript
import { WorkflowEngine } from '@moon-wave/workflow';

const engine = new WorkflowEngine(graph, maxSteps: 50);
const result = await engine.run(input, agentCtx);
```

### `WorkflowResult`

```typescript
interface WorkflowResult {
  output: unknown;
  steps: Array<{ name: string; result: unknown; durationMs: number }>;
  totalDurationMs: number;
}
```

## `WorkflowContext`

```typescript
ctx.get<T>(stepName)  // lấy kết quả bước trước
ctx.getLast<T>()      // lấy kết quả bước gần nhất
ctx.getAll()          // lấy tất cả kết quả
ctx.agentCtx          // AgentContext gốc (có env, sessionId, v.v.)
ctx.input             // input ban đầu của workflow
```
