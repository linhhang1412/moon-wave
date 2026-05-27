export type SpanStatus = 'ok' | 'error' | 'running';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: SpanStatus;
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
  error?: string;
}

export interface SpanExporter {
  export(spans: Span[]): Promise<void>;
}

export class Tracer {
  private spans = new Map<string, Span>();
  private exporters: SpanExporter[] = [];

  constructor(public readonly traceId = crypto.randomUUID()) {}

  addExporter(exporter: SpanExporter): this {
    this.exporters.push(exporter);
    return this;
  }

  startSpan(name: string, attributes: Record<string, unknown> = {}, parentSpanId?: string): string {
    const spanId = crypto.randomUUID();
    this.spans.set(spanId, {
      traceId: this.traceId,
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      status: 'running',
      attributes,
      events: [],
    });
    return spanId;
  }

  endSpan(spanId: string, status: SpanStatus = 'ok', error?: string): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    if (error) span.error = error;
    void Promise.all(this.exporters.map((e) => e.export([span])));
  }

  setAttribute(spanId: string, key: string, value: unknown): void {
    const span = this.spans.get(spanId);
    if (span) span.attributes[key] = value;
  }

  addEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = this.spans.get(spanId);
    if (span) span.events.push({ name, timestamp: Date.now(), attributes });
  }

  async trace<T>(
    name: string,
    fn: (spanId: string) => Promise<T>,
    attributes: Record<string, unknown> = {},
    parentSpanId?: string,
  ): Promise<T> {
    const spanId = this.startSpan(name, attributes, parentSpanId);
    try {
      const result = await fn(spanId);
      this.endSpan(spanId, 'ok');
      return result;
    } catch (err) {
      this.endSpan(spanId, 'error', err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  getTrace() {
    const spans = [...this.spans.values()];
    return {
      traceId: this.traceId,
      spans,
      startTime: spans.length ? Math.min(...spans.map((s) => s.startTime)) : Date.now(),
    };
  }
}
