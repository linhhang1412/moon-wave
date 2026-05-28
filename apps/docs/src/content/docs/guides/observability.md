---
title: Observability & Tracing
description: Add distributed tracing to your agents with the Tracer class and pluggable exporters
---

`@moon-wave/observability` provides a lightweight distributed tracing system. Wrap your agent and tool calls in spans to capture timing, attributes, and errors — then export traces to the console, Cloudflare D1, or your own backend.

## Installation

```bash
pnpm add @moon-wave/observability
```

## Quick start

```typescript
import { Tracer, ConsoleExporter } from '@moon-wave/observability';

const tracer = new Tracer();
tracer.addExporter(new ConsoleExporter());

const result = await tracer.trace('agent.run', async (spanId) => {
  tracer.setAttribute(spanId, 'agent', 'support');
  tracer.setAttribute(spanId, 'sessionId', ctx.sessionId);
  return myAgent.run(input, ctx);
});
// ConsoleExporter prints span details to stdout
```

## Core concepts

### Tracer

A `Tracer` owns a `traceId` (UUID) and manages all spans within that trace.

```typescript
const tracer = new Tracer();              // auto-generated traceId
const tracer = new Tracer('my-trace-id'); // custom traceId
```

### Spans

Spans represent a unit of work. Each span has a name, start/end times, status, attributes, and events.

```typescript
// Manual span lifecycle
const spanId = tracer.startSpan('fetch.users', { userId: '123' });
try {
  const users = await fetchUsers();
  tracer.endSpan(spanId, 'ok');
  return users;
} catch (err) {
  tracer.endSpan(spanId, 'error', err.message);
  throw err;
}

// Convenience wrapper (recommended)
const users = await tracer.trace('fetch.users', async (spanId) => {
  tracer.setAttribute(spanId, 'userId', '123');
  return fetchUsers();
});
```

### Attributes & events

```typescript
// Attach key-value metadata to a span
tracer.setAttribute(spanId, 'model', 'llama-3.3-70b');
tracer.setAttribute(spanId, 'tokens', 350);

// Record timestamped events within a span
tracer.addEvent(spanId, 'tool.called', { tool: 'search_web' });
tracer.addEvent(spanId, 'tool.completed', { results: 5 });
```

### Nested spans

Pass `parentSpanId` to link spans into a tree:

```typescript
const rootId = tracer.startSpan('agent.run');
const llmId  = tracer.startSpan('llm.call', { model: 'llama-3.3-70b' }, rootId);
// ...
tracer.endSpan(llmId);
tracer.endSpan(rootId);
```

Or with `tracer.trace`:

```typescript
await tracer.trace('agent.run', async (rootId) => {
  await tracer.trace('llm.call', async (llmId) => {
    // parentSpanId is rootId
    return callLLM(messages);
  }, { model: 'llama-3.3-70b' }, rootId);
});
```

## Exporters

### ConsoleExporter

Logs each completed span to `console.log`. Useful during development.

```typescript
import { ConsoleExporter } from '@moon-wave/observability';
tracer.addExporter(new ConsoleExporter());
```

### D1Exporter

Persists spans to a Cloudflare D1 database. Run the migration once to create the table:

```typescript
import { D1Exporter, TRACES_MIGRATION } from '@moon-wave/observability';

// In your worker setup / migration script:
await env.DB.exec(TRACES_MIGRATION);

// Attach the exporter
tracer.addExporter(new D1Exporter(env.DB));
```

The schema created by `TRACES_MIGRATION`:

```sql
CREATE TABLE IF NOT EXISTS traces (
  span_id       TEXT PRIMARY KEY,
  trace_id      TEXT NOT NULL,
  parent_span_id TEXT,
  name          TEXT NOT NULL,
  start_time    INTEGER NOT NULL,
  end_time      INTEGER,
  duration_ms   INTEGER,
  status        TEXT NOT NULL,
  attributes    TEXT,
  events        TEXT,
  error         TEXT
);
CREATE INDEX IF NOT EXISTS idx_trace_id ON traces(trace_id);
```

### Custom exporter

Implement `SpanExporter` to ship spans anywhere:

```typescript
import type { SpanExporter, Span } from '@moon-wave/observability';

class DatadogExporter implements SpanExporter {
  async export(spans: Span[]): Promise<void> {
    await fetch('https://http-intake.logs.datadoghq.com/api/v2/spans', {
      method: 'POST',
      headers: { 'DD-API-KEY': this.apiKey },
      body: JSON.stringify(spans),
    });
  }
}

tracer.addExporter(new DatadogExporter(env.DD_API_KEY));
```

Multiple exporters can be added — all receive every completed span:

```typescript
tracer
  .addExporter(new ConsoleExporter())
  .addExporter(new D1Exporter(env.DB));
```

## Retrieving a trace

```typescript
const trace = tracer.getTrace();
// { traceId, spans: Span[], startTime: number }
```

## Full example: tracing an agent request

```typescript
import { Tracer, D1Exporter } from '@moon-wave/observability';

export default {
  async fetch(req: Request, env: Env) {
    const tracer = new Tracer();
    tracer.addExporter(new D1Exporter(env.DB));

    const { output } = await tracer.trace('request', async (rootId) => {
      tracer.setAttribute(rootId, 'url', req.url);
      tracer.setAttribute(rootId, 'method', req.method);

      return tracer.trace('agent.run', async (agentId) => {
        tracer.setAttribute(agentId, 'agent', 'support');
        const body = await req.json() as { input: string; sessionId: string };
        return myAgent.run(body.input, { sessionId: body.sessionId, env });
      }, {}, rootId);
    });

    return Response.json({ output });
  },
};
```

## Type reference

```typescript
interface Span {
  traceId:       string;
  spanId:        string;
  parentSpanId?: string;
  name:          string;
  startTime:     number;  // epoch ms
  endTime?:      number;
  durationMs?:   number;
  status:        'ok' | 'error' | 'running';
  attributes:    Record<string, unknown>;
  events:        Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
  error?:        string;
}
```
