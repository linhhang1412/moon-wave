export interface IncomingMessage {
  channelType: 'telegram' | 'webchat';
  messageId: string;
  sessionId: string;
  userId: string;
  text: string;
  raw: unknown;
  metadata?: {
    firstName?: string;
    username?: string;
    chatId?: string | number;
    stream?: boolean;
  };
}

export interface OutgoingMessage {
  text: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface Channel {
  parse(request: Request): Promise<IncomingMessage | null>;
  send(message: OutgoingMessage, incoming: IncomingMessage): Promise<void>;
  verify(request: Request): Promise<boolean>;
}
