import type { Channel, IncomingMessage, OutgoingMessage } from './types';
import { createSSEResponse } from '@moon-wave/core';

export interface WebChatConfig {
  apiKey?: string;
}

interface WebChatPayload {
  sessionId: string;
  userId?: string;
  text: string;
  stream?: boolean;
}

export class WebChatChannel implements Channel {
  constructor(private config: WebChatConfig = {}) {}

  async verify(request: Request): Promise<boolean> {
    if (!this.config.apiKey) return true;
    return request.headers.get('X-Api-Key') === this.config.apiKey;
  }

  async parse(request: Request): Promise<IncomingMessage | null> {
    const body = (await request.json()) as WebChatPayload;
    if (!body.text) return null;

    return {
      channelType: 'webchat',
      messageId: `wc_${crypto.randomUUID()}`,
      sessionId: body.sessionId,
      userId: body.userId ?? `anon_${body.sessionId}`,
      text: body.text,
      raw: body,
      metadata: { stream: body.stream },
    };
  }

  async send(_message: OutgoingMessage, _incoming: IncomingMessage): Promise<void> {
    // SSE responses are created via createSSEResponse — no-op here
  }

  createSSEResponse(agentStream: ReadableStream<string>): Response {
    return createSSEResponse(agentStream);
  }
}
