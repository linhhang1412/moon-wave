---
title: Quan sát & Tracing
description: Thêm distributed tracing vào agent với Tracer class và các exporter có thể thay thế
---

`@moon-wave/observability` cung cấp hệ thống distributed tracing gọn nhẹ. Bọc các lệnh gọi agent và tool vào spans để theo dõi thời gian thực thi, thuộc tính, và lỗi — sau đó xuất traces ra console, Cloudflare D1, hoặc backend của bạn.

## Cài đặt

```bash
pnpm add @moon-wave/observability
```

## Bắt đầu nhanh

```typescript
import { Tracer, ConsoleExporter } from '@moon-wave/observability';

const tracer = new Tracer();
tracer.addExporter(new ConsoleExporter());

const result = await tracer.trace('agent.run', async (spanId) => {
  tracer.setAttribute(spanId, 'agent', 'support');
  tracer.setAttribute(spanId, 'sessionId', ctx.sessionId);
  return myAgent.run(input, ctx);
});
```

## Khái niệm cốt lõi

### Tracer

`Tracer` quản lý một `traceId` (UUID) và tất cả spans trong trace đó.

```typescript
const tracer = new Tracer();              // tự tạo traceId
const tracer = new Tracer('my-trace-id'); // traceId tùy chỉnh
```

### Spans

Span đại diện cho một đơn vị công việc, ghi lại tên, thời gian bắt đầu/kết thúc, trạng thái, thuộc tính, và sự kiện.

```typescript
// Quản lý span thủ công
const spanId = tracer.startSpan('fetch.users', { userId: '123' });
try {
  const users = await fetchUsers();
  tracer.endSpan(spanId, 'ok');
  return users;
} catch (err) {
  tracer.endSpan(spanId, 'error', err.message);
  throw err;
}

// Cách tiện lợi hơn (khuyên dùng)
const users = await tracer.trace('fetch.users', async (spanId) => {
  tracer.setAttribute(spanId, 'userId', '123');
  return fetchUsers();
});
```

### Thuộc tính & sự kiện

```typescript
// Gắn metadata vào span
tracer.setAttribute(spanId, 'model', 'llama-3.3-70b');
tracer.setAttribute(spanId, 'tokens', 350);

// Ghi lại sự kiện có timestamp trong span
tracer.addEvent(spanId, 'tool.called', { tool: 'search_web' });
tracer.addEvent(spanId, 'tool.completed', { results: 5 });
```

### Spans lồng nhau

Truyền `parentSpanId` để liên kết các spans thành cây:

```typescript
await tracer.trace('agent.run', async (rootId) => {
  await tracer.trace('llm.call', async (llmId) => {
    return callLLM(messages);
  }, { model: 'llama-3.3-70b' }, rootId);  // rootId là parent
});
```

## Exporters

### ConsoleExporter

Ghi log từng span đã hoàn thành ra `console.log`. Dùng trong quá trình phát triển.

```typescript
import { ConsoleExporter } from '@moon-wave/observability';
tracer.addExporter(new ConsoleExporter());
```

### D1Exporter

Lưu spans vào Cloudflare D1. Chạy migration một lần để tạo bảng:

```typescript
import { D1Exporter, TRACES_MIGRATION } from '@moon-wave/observability';

// Trong worker setup / migration script:
await env.DB.exec(TRACES_MIGRATION);

// Gắn exporter
tracer.addExporter(new D1Exporter(env.DB));
```

### Exporter tùy chỉnh

Implement `SpanExporter` để gửi spans đến bất kỳ đâu:

```typescript
import type { SpanExporter, Span } from '@moon-wave/observability';

class MyExporter implements SpanExporter {
  async export(spans: Span[]): Promise<void> {
    await fetch('https://my-monitoring.example.com/spans', {
      method: 'POST',
      body: JSON.stringify(spans),
    });
  }
}
```

Có thể thêm nhiều exporters — tất cả đều nhận mọi span đã hoàn thành:

```typescript
tracer
  .addExporter(new ConsoleExporter())
  .addExporter(new D1Exporter(env.DB));
```

## Lấy lại trace

```typescript
const trace = tracer.getTrace();
// { traceId, spans: Span[], startTime: number }
```

## Ví dụ đầy đủ

```typescript
import { Tracer, D1Exporter } from '@moon-wave/observability';

export default {
  async fetch(req: Request, env: Env) {
    const tracer = new Tracer();
    tracer.addExporter(new D1Exporter(env.DB));

    const { output } = await tracer.trace('request', async (rootId) => {
      tracer.setAttribute(rootId, 'url', req.url);
      const body = await req.json() as { input: string; sessionId: string };

      return tracer.trace('agent.run', async (agentId) => {
        tracer.setAttribute(agentId, 'agent', 'support');
        return myAgent.run(body.input, { sessionId: body.sessionId, env });
      }, {}, rootId);
    });

    return Response.json({ output });
  },
};
```
