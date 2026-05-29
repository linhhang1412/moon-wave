export type ObjectType = 'user' | 'organization' | 'agent' | 'session';

export type RelationType = 'owner' | 'editor' | 'viewer' | 'member' | 'admin';

export interface ReBACTuple {
  objectType: ObjectType;
  objectId: string;
  relation: RelationType;
  subjectType: ObjectType;
  subjectId: string;
  /** For group references, e.g. "member" means subject is "organization:id#member" */
  subjectRelation?: RelationType;
}

export interface ReBACTupleRecord extends ReBACTuple {
  id: number;
  createdAt: string;
}

export interface ReBACUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  /** Present only when freshly generated — never returned by listUsers() */
  apiKey?: string;
}

export interface CheckResult {
  allowed: boolean;
}

/** Minimal D1 binding interface (compatible with Cloudflare Workers D1) */
export interface D1DatabaseBinding {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<void>;
    };
  };
  exec(query: string): Promise<void>;
}
