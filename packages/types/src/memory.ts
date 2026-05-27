import type { Message } from './llm';

export interface MemoryAdapter {
  getMessages(sessionId: string): Promise<Message[]>;
  addMessage(sessionId: string, message: Message): Promise<void>;
  clearSession(sessionId: string): Promise<void>;
}

export interface VectorItem {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorAdapter {
  insert(vectors: VectorItem[]): Promise<void>;
  query(vector: number[], topK: number): Promise<VectorMatch[]>;
  delete(ids: string[]): Promise<void>;
}
