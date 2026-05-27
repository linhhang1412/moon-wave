import type { Span, SpanExporter } from './Tracer';

export class ConsoleExporter implements SpanExporter {
  async export(spans: Span[]): Promise<void> {
    for (const span of spans) {
      const icon = span.status === 'error' ? '✗' : '✓';
      const dur = span.durationMs != null ? `${span.durationMs}ms` : 'running';
      console.log(`${icon} [${span.name}] ${dur}`, span.attributes);
      if (span.error) console.error(`  Error: ${span.error}`);
    }
  }
}

export interface D1DatabaseBinding {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<void> };
  };
  batch(stmts: ReturnType<ReturnType<D1DatabaseBinding['prepare']>['bind']>[]): Promise<void>;
}

export class D1Exporter implements SpanExporter {
  constructor(private db: D1DatabaseBinding) {}

  async export(spans: Span[]): Promise<void> {
    const stmts = spans.map((span) =>
      this.db
        .prepare(
          `INSERT INTO agent_traces
           (trace_id, span_id, parent_span_id, name,
            start_time, end_time, duration_ms, status, attributes, error)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          span.traceId,
          span.spanId,
          span.parentSpanId ?? null,
          span.name,
          span.startTime,
          span.endTime ?? null,
          span.durationMs ?? null,
          span.status,
          JSON.stringify(span.attributes),
          span.error ?? null,
        ),
    );
    await this.db.batch(stmts);
  }
}

export const TRACES_MIGRATION = `
CREATE TABLE IF NOT EXISTS agent_traces (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_id       TEXT NOT NULL,
  span_id        TEXT NOT NULL UNIQUE,
  parent_span_id TEXT,
  name           TEXT NOT NULL,
  start_time     INTEGER NOT NULL,
  end_time       INTEGER,
  duration_ms    INTEGER,
  status         TEXT NOT NULL,
  attributes     TEXT,
  error          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trace ON agent_traces(trace_id);
`;
