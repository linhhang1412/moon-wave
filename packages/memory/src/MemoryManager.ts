import type { Message } from '@moon-wave/types';
import type { KVMemoryAdapter } from './adapters/kv';
import type { D1MemoryAdapter } from './adapters/d1';
import type { VectorizeAdapter } from './adapters/vectorize';

interface MemoryManagerConfig {
  shortTerm?: KVMemoryAdapter;
  longTerm?: D1MemoryAdapter;
  vector?: VectorizeAdapter;
}

export class MemoryManager {
  constructor(private config: MemoryManagerConfig) {}

  async getMessages(sessionId: string): Promise<Message[]> {
    if (this.config.longTerm) return this.config.longTerm.getMessages(sessionId);
    if (this.config.shortTerm) return this.config.shortTerm.getMessages(sessionId);
    return [];
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    await Promise.all([
      this.config.shortTerm?.addMessage(sessionId, message),
      this.config.longTerm?.addMessage(sessionId, message),
    ]);
  }

  async clearSession(sessionId: string): Promise<void> {
    await Promise.all([
      this.config.shortTerm?.clearSession(sessionId),
      this.config.longTerm?.clearSession(sessionId),
    ]);
  }

  async remember(text: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.config.vector?.insertText(crypto.randomUUID(), text, metadata);
  }

  async recall(query: string, topK = 5): Promise<string[]> {
    if (!this.config.vector) return [];
    const matches = await this.config.vector.queryByText(query, topK);
    return matches.map((m) => m.metadata?.text as string).filter(Boolean);
  }
}
