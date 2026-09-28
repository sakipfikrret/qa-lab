import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { Store, COLLECTIONS } from '../server/db';

const empty = () => Object.fromEntries(COLLECTIONS.map(c => [c, [] as any[]])) as any;

describe('SQLite store', () => {
  test('round-trips, preserves order, applies deletes and updates', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qalab-')), 'db.sqlite');
    const a = new Store(file);
    const st = empty();
    st.bugs = [{ id: 'b2', t: 'two' }, { id: 'b1', t: 'one' }];
    a.save(st);
    st.bugs = [{ id: 'b2', t: 'TWO' }];
    st.projects = [{ id: 'p1' }];
    a.save(st);
    a.close();

    const b = new Store(file);
    const loaded = b.load();
    assert.deepEqual(loaded.bugs, [{ id: 'b2', t: 'TWO' }]);
    assert.deepEqual(loaded.projects, [{ id: 'p1' }]);
    b.close();
  });

  test('a failing save rolls back completely', () => {
    const s = new Store(':memory:');
    const st = empty();
    st.bugs = [{ id: 'ok' }];
    s.save(st);
    const circular: any = { id: 'bad' }; circular.self = circular;
    st.bugs = [{ id: 'ok', changed: true }, circular];
    assert.throws(() => s.save(st));
    const fresh = s.load();
    assert.deepEqual(fresh.bugs, [{ id: 'ok' }]);
  });
});
