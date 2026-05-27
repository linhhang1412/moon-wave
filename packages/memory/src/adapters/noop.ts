import type { MemoryAdapter, Message } from '@moon-wave/types';

export class NoopMemoryAdapter implements MemoryAdapter {
  async getMessages(_sessionId: string): Promise<Message[]> {
    return [];
  }
  async addMessage(_sessionId: string, _message: Message): Promise<void> {}
  async clearSession(_sessionId: string): Promise<void> {}
}
