# @moon-wave/observability

Distributed tracing for moon-wave — track agent runs, tool calls, and LLM latency with spans.

## Installation

```bash
npm install @moon-wave/observability
```

## Quick Start

```typescript
import { Tracer, ConsoleExporter } from '@moon-wave/observability';

const tracer = new Tracer();
tracer.addExporter(new ConsoleExporter());

// Wrap any async operation in a span
const result = await tracer.trace('agent_run', async (spanId) => {
  tracer.setAttribute(spanId, 'model', 'llama-3.3-70b-versatile');
  return await agent.run(input, ctx);
});

// Get full trace
const trace = tracer.getTrace();
console.log(trace.spans);
```

## Exporters

### `ConsoleExporter`

Logs spans to console. Good for development:

```typescript
import { ConsoleExporter } from '@moon-wave/observability';
tracer.addExporter(new ConsoleExporter());
// ✓ [agent_run] 312ms { model: 'llama-3.3-70b-versatile' }
// ✓ [tool_call/get_time] 5ms { tool: 'get_time' }
```

### `D1Exporter`

Persists spans to Cloudflare D1. Run migration once before using:

```typescript
import { D1Exporter, TRACES_MIGRATION } from '@moon-wave/observability';

// Run once to create the table
await env.DB.exec(TRACES_MIGRATION);

tracer.addExporter(new D1Exporter(env.DB));
```

**Schema created by `TRACES_MIGRATION`:**
```sql
CREATE TABLE agent_traces (
  trace_id, span_id, parent_span_id, name,
  start_time, end_time, duration_ms, status,
  attributes, error, created_at
);
```

## API

### `Tracer`

```typescript
class Tracer {
  readonly traceId: string

  startSpan(name: string, attributes?: Record<string, unknown>, parentSpanId?: string): string
  endSpan(spanId: string, status?: 'ok' | 'error', error?: string): void
  setAttribute(spanId: string, key: string, value: unknown): void
  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void

  // Convenience wrapper: starts span, runs fn, ends span automatically
  trace<T>(name: string, fn: (spanId: string) => Promise<T>, attributes?: Record<string, unknown>): Promise<T>

  addExporter(exporter: SpanExporter): this
  getTrace(): { traceId: string; spans: Span[]; startTime: number }
}
```

### `SpanExporter` interface

```typescript
interface SpanExporter {
  export(spans: Span[]): Promise<void>;
}
```

Implement to send traces to Datadog, Honeycomb, or any OpenTelemetry backend.

## Integration with MCP

When using `@moon-wave/mcp`, traces are created automatically per `run_agent` call and retrievable via the `get_trace` MCP tool.

## License

MIT
