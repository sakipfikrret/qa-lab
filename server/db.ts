import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

export const COLLECTIONS = ['projects', 'requirements', 'testCases', 'testRuns', 'bugs', 'insights'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];
export type State = Record<CollectionName, any[]>;

/**
 * SQLite-backed document store. Each entity is a JSON row; writes are diffed against
 * what was last written and applied in a single transaction, so a crash can never
 * leave a half-written file behind (the old JSON-file approach could).
 */
export class Store {
  readonly db: DatabaseSync;
  private written = new Map<string, string>();

  constructor(file: string) {
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS docs (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        position INTEGER NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (collection, id)
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','member')),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
    `);
  }

  isEmpty(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM docs').get() as { n: number };
    return row.n === 0;
  }

  load(): State {
    const out = Object.fromEntries(COLLECTIONS.map(c => [c, [] as any[]])) as State;
    const rows = this.db.prepare('SELECT collection, id, position, data FROM docs ORDER BY collection, position').all() as any[];
    for (const r of rows) {
      if ((COLLECTIONS as readonly string[]).includes(r.collection)) {
        out[r.collection as CollectionName].push(JSON.parse(r.data));
        this.written.set(`${r.collection}|${r.id}`, `${r.position}|${r.data}`);
      }
    }
    return out;
  }

  save(state: State): void {
    const upsert = this.db.prepare(
      'INSERT INTO docs (collection, id, position, data) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(collection, id) DO UPDATE SET position = excluded.position, data = excluded.data'
    );
    const del = this.db.prepare('DELETE FROM docs WHERE collection = ? AND id = ?');
    const seen = new Set<string>();
    const nextWritten = new Map(this.written);

    this.db.exec('BEGIN');
    try {
      for (const c of COLLECTIONS) {
        state[c].forEach((doc, position) => {
          const key = `${c}|${doc.id}`;
          const data = JSON.stringify(doc);
          const sig = `${position}|${data}`;
          seen.add(key);
          if (this.written.get(key) !== sig) {
            upsert.run(c, String(doc.id), position, data);
            nextWritten.set(key, sig);
          }
        });
      }
      for (const key of this.written.keys()) {
        if (!seen.has(key)) {
          const [c, id] = key.split('|');
          del.run(c, id);
          nextWritten.delete(key);
        }
      }
      this.db.exec('COMMIT');
      this.written = nextWritten;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  close() { this.db.close(); }
}
