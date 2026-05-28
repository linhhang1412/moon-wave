import type { MemoryAdapter, Message } from '@moon-wave/types';

export interface D1DatabaseBinding {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      run(): Promise<void>;
    };
  };
}

export const MESSAGES_MIGRATION = `
CREATE TABLE IF NOT EXISTS agent_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  role         TEXT NOT NULL,
  content      TEXT NOT NULL,
  tool_call_id TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_session ON agent_messages(session_id, created_at);
`.trim();

const DEFAULT_LIMIT = 100;

export class D1MemoryAdapter implements MemoryAdapter {
  constructor(private db: D1DatabaseBinding) {}

  async getMessages(sessionId: string, limit = DEFAULT_LIMIT): Promise<Message[]> {
    const { results } = await this.db
      .prepare(
        `SELECT role, content, tool_call_id
         FROM agent_messages
         WHERE session_id = ?
         ORDER BY created_at ASC
         LIMIT ?`,
      )
      .bind(sessionId, limit)
      .all<{ role: string; content: string; tool_call_id: string | null }>();

    return results.map((row) => ({
      role: row.role as Message['role'],
      content: row.content,
      ...(row.tool_call_id && { toolCallId: row.tool_call_id }),
    }));
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO agent_messages (session_id, role, content, tool_call_id)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(sessionId, message.role, message.content, message.toolCallId ?? null)
      .run();
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM agent_messages WHERE session_id = ?')
      .bind(sessionId)
      .run();
  }
}
