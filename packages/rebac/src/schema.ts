export const REBAC_MIGRATION = `
CREATE TABLE IF NOT EXISTS rebac_users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rebac_tuples (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  object_type      TEXT NOT NULL,
  object_id        TEXT NOT NULL,
  relation         TEXT NOT NULL,
  subject_type     TEXT NOT NULL,
  subject_id       TEXT NOT NULL,
  subject_relation TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(object_type, object_id, relation, subject_type, subject_id, COALESCE(subject_relation, ''))
);

CREATE INDEX IF NOT EXISTS idx_rebac_object  ON rebac_tuples(object_type, object_id, relation);
CREATE INDEX IF NOT EXISTS idx_rebac_subject ON rebac_tuples(subject_type, subject_id);
`.trim();
