import type { D1DatabaseBinding, ObjectType, ReBACTuple, ReBACTupleRecord, ReBACUser, RelationType } from './types';
import { REBAC_MIGRATION } from './schema';

interface TupleRow {
  id: number;
  object_type: string;
  object_id: string;
  relation: string;
  subject_type: string;
  subject_id: string;
  subject_relation: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export class D1ReBAC {
  constructor(private db: D1DatabaseBinding) {}

  async migrate(): Promise<void> {
    const statements = REBAC_MIGRATION.split(';\n').map(s => s.trim()).filter(Boolean);
    for (const sql of statements) {
      await this.db.prepare(sql + ';').bind().run();
    }
  }

  async writeTuple(tuple: ReBACTuple): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR IGNORE INTO rebac_tuples
           (object_type, object_id, relation, subject_type, subject_id, subject_relation)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(tuple.objectType, tuple.objectId, tuple.relation, tuple.subjectType, tuple.subjectId, tuple.subjectRelation ?? null)
      .run();
  }

  async deleteTuple(tuple: ReBACTuple): Promise<void> {
    await this.db
      .prepare(
        `DELETE FROM rebac_tuples
         WHERE object_type = ? AND object_id = ? AND relation = ?
           AND subject_type = ? AND subject_id = ?
           AND COALESCE(subject_relation, '') = COALESCE(?, '')`,
      )
      .bind(tuple.objectType, tuple.objectId, tuple.relation, tuple.subjectType, tuple.subjectId, tuple.subjectRelation ?? null)
      .run();
  }

  async listTuples(filter?: { objectType?: ObjectType; objectId?: string }): Promise<ReBACTupleRecord[]> {
    let sql = 'SELECT * FROM rebac_tuples';
    const bindings: unknown[] = [];

    if (filter?.objectType && filter?.objectId) {
      sql += ' WHERE object_type = ? AND object_id = ?';
      bindings.push(filter.objectType, filter.objectId);
    } else if (filter?.objectType) {
      sql += ' WHERE object_type = ?';
      bindings.push(filter.objectType);
    }

    sql += ' ORDER BY created_at DESC';

    const { results } = await this.db.prepare(sql).bind(...bindings).all<TupleRow>();
    return results.map(rowToTuple);
  }

  /**
   * Check if subject has `relation` on object.
   * Supports 1-level group expansion:
   *   If a tuple says (object, relation) → (org, orgId, #member),
   *   we check if (org, member) → (subject) also exists.
   */
  async check(
    subjectType: ObjectType,
    subjectId: string,
    relation: RelationType,
    objectType: ObjectType,
    objectId: string,
  ): Promise<boolean> {
    // Direct match
    const direct = await this.db
      .prepare(
        `SELECT 1 FROM rebac_tuples
         WHERE object_type = ? AND object_id = ? AND relation = ?
           AND subject_type = ? AND subject_id = ? AND subject_relation IS NULL
         LIMIT 1`,
      )
      .bind(objectType, objectId, relation, subjectType, subjectId)
      .first<{ 1: number }>();

    if (direct) return true;

    // Group expansion: find tuples where subject is a group reference
    // e.g., (agent:X, editor) → (organization:acme, #member)
    // then check if (organization:acme, member) → (user:alice)
    const groupTuples = await this.db
      .prepare(
        `SELECT subject_type, subject_id, subject_relation
         FROM rebac_tuples
         WHERE object_type = ? AND object_id = ? AND relation = ?
           AND subject_relation IS NOT NULL`,
      )
      .bind(objectType, objectId, relation)
      .all<{ subject_type: string; subject_id: string; subject_relation: string }>();

    for (const group of groupTuples.results) {
      const memberCheck = await this.db
        .prepare(
          `SELECT 1 FROM rebac_tuples
           WHERE object_type = ? AND object_id = ? AND relation = ?
             AND subject_type = ? AND subject_id = ? AND subject_relation IS NULL
           LIMIT 1`,
        )
        .bind(group.subject_type, group.subject_id, group.subject_relation, subjectType, subjectId)
        .first<{ 1: number }>();

      if (memberCheck) return true;
    }

    return false;
  }

  async listSubjectsForObject(
    objectType: ObjectType,
    objectId: string,
    relation: RelationType,
  ): Promise<Array<{ subjectType: string; subjectId: string; subjectRelation?: string }>> {
    const { results } = await this.db
      .prepare(
        `SELECT subject_type, subject_id, subject_relation
         FROM rebac_tuples
         WHERE object_type = ? AND object_id = ? AND relation = ?
         ORDER BY created_at DESC`,
      )
      .bind(objectType, objectId, relation)
      .all<{ subject_type: string; subject_id: string; subject_relation: string | null }>();

    return results.map(r => ({
      subjectType: r.subject_type,
      subjectId: r.subject_id,
      ...(r.subject_relation ? { subjectRelation: r.subject_relation } : {}),
    }));
  }

  async listObjectsForSubject(
    subjectType: ObjectType,
    subjectId: string,
    relation: RelationType,
    targetObjectType: ObjectType,
  ): Promise<string[]> {
    const { results } = await this.db
      .prepare(
        `SELECT object_id FROM rebac_tuples
         WHERE subject_type = ? AND subject_id = ? AND relation = ? AND object_type = ?
         ORDER BY created_at DESC`,
      )
      .bind(subjectType, subjectId, relation, targetObjectType)
      .all<{ object_id: string }>();

    return results.map(r => r.object_id);
  }

  async createUser(id: string, name: string, email: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO rebac_users (id, name, email) VALUES (?, ?, ?)`,
      )
      .bind(id, name, email)
      .run();
  }

  async listUsers(): Promise<ReBACUser[]> {
    const { results } = await this.db
      .prepare('SELECT id, name, email, created_at FROM rebac_users ORDER BY created_at DESC')
      .bind()
      .all<UserRow>();
    return results.map(rowToUser);
  }

  async getUser(id: string): Promise<ReBACUser | null> {
    const row = await this.db
      .prepare('SELECT id, name, email, created_at FROM rebac_users WHERE id = ?')
      .bind(id)
      .first<UserRow>();
    return row ? rowToUser(row) : null;
  }
}

function rowToTuple(row: TupleRow): ReBACTupleRecord {
  return {
    id: row.id,
    objectType: row.object_type as ObjectType,
    objectId: row.object_id,
    relation: row.relation as RelationType,
    subjectType: row.subject_type as ObjectType,
    subjectId: row.subject_id,
    ...(row.subject_relation ? { subjectRelation: row.subject_relation as RelationType } : {}),
    createdAt: row.created_at,
  };
}

function rowToUser(row: UserRow): ReBACUser {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}
