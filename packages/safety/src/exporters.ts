import type { SafetyEvent } from '@moon-wave/types';

interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<void> };
  };
}

export class D1SafetyExporter {
  constructor(private db: D1Database) {}

  async export(event: SafetyEvent): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO safety_events
         (event_id, trace_id, agent_name, session_id, user_id,
          phase, action, guardrail, reason, severity, content_snippet, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        event.eventId,
        event.traceId ?? null,
        event.agentName,
        event.sessionId,
        event.userId ?? null,
        event.phase,
        event.action,
        event.guardrail,
        event.reason,
        event.severity,
        event.contentSnippet,
        event.timestamp,
      )
      .run();
  }
}

export const SAFETY_MIGRATION = `
CREATE TABLE IF NOT EXISTS safety_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id        TEXT NOT NULL UNIQUE,
  trace_id        TEXT,
  agent_name      TEXT NOT NULL,
  session_id      TEXT NOT NULL,
  user_id         TEXT,
  phase           TEXT NOT NULL,
  action          TEXT NOT NULL,
  guardrail       TEXT NOT NULL,
  reason          TEXT NOT NULL,
  severity        TEXT NOT NULL,
  content_snippet TEXT,
  timestamp       TEXT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_safety_agent    ON safety_events(agent_name);
CREATE INDEX IF NOT EXISTS idx_safety_session  ON safety_events(session_id);
CREATE INDEX IF NOT EXISTS idx_safety_action   ON safety_events(action);
CREATE INDEX IF NOT EXISTS idx_safety_severity ON safety_events(severity);
`;
