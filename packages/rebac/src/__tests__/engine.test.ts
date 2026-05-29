import { describe, it, expect, beforeEach } from 'vitest';
import { D1ReBAC } from '../engine';
import type { D1DatabaseBinding } from '../types';

// In-memory mock for D1
function createMockD1(): D1DatabaseBinding {
  const tables: Record<string, Record<string, unknown>[]> = {
    rebac_users: [],
    rebac_tuples: [],
  };
  let autoId = 1;

  function matchRow(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
    return Object.entries(where).every(([k, v]) => {
      if (v === null) return row[k] === null || row[k] === undefined;
      return row[k] === v;
    });
  }

  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async all<T>() {
              if (sql.includes('FROM rebac_tuples') && !sql.includes('INSERT') && !sql.includes('DELETE')) {
                const whereMatch = sql.match(/WHERE (.+?)(?:\s+ORDER|\s+LIMIT|$)/s);
                if (!whereMatch) return { results: tables.rebac_tuples as T[] };

                const conditions = whereMatch[1];
                let results = tables.rebac_tuples.filter(row => {
                  const parts = conditions.split(' AND ').map(s => s.trim());
                  return parts.every((part, idx) => {
                    if (part.includes('subject_relation IS NOT NULL')) return row.subject_relation != null;
                    if (part.includes('subject_relation IS NULL')) return row.subject_relation == null;
                    if (part.includes('= ?')) return row[part.split(' = ?')[0].trim().replace(/^.+\./, '')] === values[idx];
                    return true;
                  });
                });
                return { results: results as T[] };
              }
              if (sql.includes('FROM rebac_users')) {
                return { results: tables.rebac_users as T[] };
              }
              return { results: [] as T[] };
            },
            async first<T>() {
              if (sql.includes('SELECT 1 FROM rebac_tuples')) {
                const [ot, oi, rel, st, si] = values as string[];
                const found = tables.rebac_tuples.find(r =>
                  r.object_type === ot && r.object_id === oi && r.relation === rel &&
                  r.subject_type === st && r.subject_id === si && r.subject_relation == null
                );
                return (found ? { 1: 1 } : null) as T;
              }
              if (sql.includes('FROM rebac_users WHERE id')) {
                const found = tables.rebac_users.find(r => r.id === values[0]);
                return (found ?? null) as T;
              }
              return null as T;
            },
            async run() {
              if (sql.startsWith('INSERT OR IGNORE INTO rebac_tuples')) {
                const [ot, oi, rel, st, si, sr] = values;
                const existing = tables.rebac_tuples.find(r =>
                  r.object_type === ot && r.object_id === oi && r.relation === rel &&
                  r.subject_type === st && r.subject_id === si &&
                  (r.subject_relation ?? null) === (sr ?? null)
                );
                if (!existing) {
                  tables.rebac_tuples.push({ id: autoId++, object_type: ot, object_id: oi, relation: rel, subject_type: st, subject_id: si, subject_relation: sr ?? null, created_at: new Date().toISOString() });
                }
              } else if (sql.startsWith('DELETE FROM rebac_tuples')) {
                const [ot, oi, rel, st, si] = values;
                tables.rebac_tuples = tables.rebac_tuples.filter(r =>
                  !(r.object_type === ot && r.object_id === oi && r.relation === rel && r.subject_type === st && r.subject_id === si)
                );
              } else if (sql.startsWith('INSERT INTO rebac_users')) {
                const [id, name, email] = values;
                tables.rebac_users.push({ id, name, email, created_at: new Date().toISOString() });
              } else if (sql.trim().endsWith(';') || sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX')) {
                // DDL — no-op in mock
              }
            },
          };
        },
      };
    },
    async exec() {},
  };
}

describe('D1ReBAC', () => {
  let rebac: D1ReBAC;

  beforeEach(() => {
    rebac = new D1ReBAC(createMockD1());
  });

  it('returns false when no tuples exist', async () => {
    const allowed = await rebac.check('user', 'alice', 'owner', 'agent', 'summarizer');
    expect(allowed).toBe(false);
  });

  it('grants direct ownership', async () => {
    await rebac.writeTuple({ objectType: 'agent', objectId: 'summarizer', relation: 'owner', subjectType: 'user', subjectId: 'alice' });
    expect(await rebac.check('user', 'alice', 'owner', 'agent', 'summarizer')).toBe(true);
  });

  it('denies mismatched relation', async () => {
    await rebac.writeTuple({ objectType: 'agent', objectId: 'summarizer', relation: 'viewer', subjectType: 'user', subjectId: 'alice' });
    expect(await rebac.check('user', 'alice', 'owner', 'agent', 'summarizer')).toBe(false);
  });

  it('denies after tuple deletion', async () => {
    const tuple = { objectType: 'agent' as const, objectId: 'summarizer', relation: 'owner' as const, subjectType: 'user' as const, subjectId: 'alice' };
    await rebac.writeTuple(tuple);
    await rebac.deleteTuple(tuple);
    expect(await rebac.check('user', 'alice', 'owner', 'agent', 'summarizer')).toBe(false);
  });

  it('creates and lists users', async () => {
    await rebac.createUser('u1', 'Alice', 'alice@example.com');
    const users = await rebac.listUsers();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
  });
});
