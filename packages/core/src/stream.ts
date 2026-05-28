import type { StreamEvent } from '@moon-wave/types';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

export function createSSEResponse(stream: ReadableStream<string>): Response {
  const encoder = new TextEncoder();

  const sseStream = stream.pipeThrough(
    new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
      },
      flush(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      },
    }),
  );

  return new Response(sseStream, { headers: SSE_HEADERS });
}

export function createEventStreamResponse(stream: ReadableStream<StreamEvent>): Response {
  const encoder = new TextEncoder();

  const sseStream = stream.pipeThrough(
    new TransformStream<StreamEvent, Uint8Array>({
      transform(event, controller) {
        controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      },
      flush(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      },
    }),
  );

  return new Response(sseStream, { headers: SSE_HEADERS });
}
