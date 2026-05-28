import type { MemoryAdapter, Message } from '@moon-wave/types';

const SESSION_TTL = 60 * 60 * 24; // 24h
const DEFAULT_MAX_MESSAGES = 50;

export interface KVNamespaceBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export class KVMemoryAdapter implements MemoryAdapter {
  private maxMessages: number;

  constructor(
    private kv: KVNamespaceBinding,
    options: { maxMessages?: number } = {},
  ) {
    this.maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const raw = await this.kv.get(`session:${sessionId}`);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    // NOTE: KV does not support atomic updates. Under concurrent writes to the same
    // sessionId, messages may be lost. Use D1MemoryAdapter for workloads with concurrent
    // session writes.
    const messages = await this.getMessages(sessionId);
    messages.push(message);
    const trimmed = messages.slice(-this.maxMessages);
    await this.kv.put(`session:${sessionId}`, JSON.stringify(trimmed), {
      expirationTtl: SESSION_TTL,
    });
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.kv.delete(`session:${sessionId}`);
  }
}
