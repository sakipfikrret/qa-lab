process.env.DB_FILE = ':memory:';
process.env.NODE_ENV = 'test';
delete process.env.ALLOW_SIGNUP;
delete process.env.AUTH_DISABLED;
delete process.env.GEMINI_API_KEY;

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

let base = '';
let server: Server;
let setAiClient: (c: any) => void;

class Jar {
  cookie = '';
  async call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(this.cookie ? { cookie: this.cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.split(';')[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }
}

before(async () => {
  const mod = await import('../server');
  setAiClient = (mod as any).setAiClient;
  server = mod.app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => { server.close(); });

const admin = new Jar();
const member = new Jar();

describe('authentication', () => {
  test('API requires a session', async () => {
    const r = await new Jar().call('GET', '/api/projects');
    assert.equal(r.status, 401);
  });

  test('health is public and leaks nothing', async () => {
    const r = await new Jar().call('GET', '/api/health');
    assert.deepEqual(r.body, { status: 'ok' });
  });

  test('first registration becomes admin, weak passwords rejected', async () => {
    const st = await admin.call('GET', '/api/auth/status');
    assert.equal(st.body.needsSetup, true);
    const weak = await admin.call('POST', '/api/auth/register', { email: 'a@b.co', name: 'Ada', password: 'short' });
    assert.equal(weak.status, 400);
    const ok = await admin.call('POST', '/api/auth/register', { email: 'ada@lab.dev', name: 'Ada', password: 'correct-horse-battery' });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.user.role, 'admin');
    assert.ok(!JSON.stringify(ok.body).includes('scrypt'));
  });

  test('public sign-up is closed after the first user', async () => {
    const r = await new Jar().call('POST', '/api/auth/register', { email: 'x@lab.dev', name: 'X', password: 'correct-horse-battery' });
    assert.equal(r.status, 403);
  });

  test('wrong password fails, right password works, logout revokes the session', async () => {
    const j = new Jar();
    assert.equal((await j.call('POST', '/api/auth/login', { email: 'ada@lab.dev', password: 'wrong-password-123' })).status, 401);
    assert.equal((await j.call('POST', '/api/auth/login', { email: 'ada@lab.dev', password: 'correct-horse-battery' })).status, 200);
    assert.equal((await j.call('GET', '/api/projects')).status, 200);
    const stale = j.cookie;
    await j.call('POST', '/api/auth/logout');
    j.cookie = stale; // the old token must be dead server-side, not just cleared in the browser
    assert.equal((await j.call('GET', '/api/projects')).status, 401);
    assert.equal((await admin.call('GET', '/api/projects')).status, 200); // other sessions unaffected
  });

  test('cross-origin writes are blocked', async () => {
    const r = await admin.call('POST', '/api/bugs', { title: 'x' }, { origin: 'https://evil.example' });
    assert.equal(r.status, 403);
  });

  test('admin adds a member; members cannot add users or reset data', async () => {
    const add = await admin.call('POST', '/api/users', { email: 'bob@lab.dev', name: 'Bob', password: 'another-long-passphrase', role: 'member' });
    assert.equal(add.status, 201);
    await member.call('POST', '/api/auth/login', { email: 'bob@lab.dev', password: 'another-long-passphrase' });
    assert.equal((await member.call('POST', '/api/users', { email: 'e@lab.dev', name: 'E', password: 'another-long-passphrase' })).status, 403);
    assert.equal((await member.call('POST', '/api/reset-demo')).status, 403);
  });
});

describe('data integrity', () => {
  test('new runs start with PENDING steps and consistent ids', async () => {
    const tcs = (await admin.call('GET', '/api/test-cases')).body;
    const run = (await admin.call('POST', '/api/test-runs', { testCaseIds: [tcs[0].id] })).body;
    const result = Object.values(run.results)[0] as any;
    assert.equal(result.testRunId, run.id);
    assert.equal(result.executedBy, 'Ada');
    assert.ok(result.stepResults.every((s: any) => s.status === 'PENDING'));
  });

  test('test case PUT ignores protected fields', async () => {
    const tc = (await admin.call('GET', '/api/test-cases')).body[0];
    const r = await admin.call('PUT', `/api/test-cases/${tc.id}`, { id: 'hijack', projectId: 'other', title: 'Renamed', priority: 'nonsense' });
    assert.equal(r.body.id, tc.id);
    assert.equal(r.body.projectId, tc.projectId);
    assert.equal(r.body.title, 'Renamed');
    assert.equal(r.body.priority, tc.priority);
  });

  test('bug PUT only accepts whitelisted fields and records the acting user', async () => {
    const bug = (await admin.call('GET', '/api/bugs')).body[0];
    const r = await member.call('PUT', `/api/bugs/${bug.id}`, { status: 'Fixed', id: 'x', bugId: 'BUG-999', history: [] });
    assert.equal(r.body.status, 'Fixed');
    assert.equal(r.body.bugId, bug.bugId);
    assert.ok(r.body.history[0].actor === 'Bob');
    assert.equal((await member.call('PUT', `/api/bugs/${bug.id}`, { status: 'Garbage' })).body.status, 'Fixed');
  });

  test('validation rejects malformed input', async () => {
    assert.equal((await admin.call('POST', '/api/test-cases', { title: 'no steps' })).status, 400);
    assert.equal((await admin.call('POST', '/api/bugs', {})).status, 400);
    assert.equal((await admin.call('POST', '/api/projects', { name: 'x', type: 'Nope' })).status, 400);
    assert.equal((await admin.call('POST', '/api/test-cases/generate', { requirementText: 'a'.repeat(20001) })).status, 413);
  });
});

describe('AI paths (fake Gemini client)', () => {
  const fake = (text: string) => ({ models: { generateContent: async () => ({ text }) } });

  test('without a key nothing is fabricated', async () => {
    setAiClient(null);
    const r = await admin.call('POST', '/api/requirements/risks', { requirementsText: 'login flow' });
    assert.equal(r.body.isRealAI, false);
    assert.deepEqual(r.body.risks, []);
    const g = await admin.call('POST', '/api/test-cases/generate', { requirementText: 'login flow' });
    assert.equal(g.body.testCases[0].status, 'Needs Review');
  });

  test('fenced JSON is parsed, enums are normalised, output is never auto-approved', async () => {
    setAiClient(fake('```json\n[{"code":"TC-X","title":"T","priority":"critical","type":"Security | Edge Case","steps":[{"stepNumber":1,"action":"a","expected":"b"}]}]\n```'));
    const r = await admin.call('POST', '/api/test-cases/generate', { requirementText: 'login flow' });
    const tc = r.body.testCases[0];
    assert.equal(r.body.isRealAI, true);
    assert.equal(tc.priority, 'Critical');
    assert.equal(tc.type, 'Functional');
    assert.equal(tc.status, 'Needs Review');
  });

  test('garbage AI output falls back instead of crashing', async () => {
    setAiClient(fake('not json at all'));
    const r = await admin.call('POST', '/api/test-cases/generate', { requirementText: 'login flow' });
    assert.equal(r.status, 200);
    assert.equal(r.body.isRealAI, false);
  });

  test('failure analysis normalises confidence', async () => {
    setAiClient(fake('{"failureSummary":"s","probableCause":"c","confidence":"very high"}'));
    const tc = (await admin.call('GET', '/api/test-cases')).body[0];
    const r = await admin.call('POST', '/api/failures/analyze', { testCase: tc, actualResult: 'boom' });
    assert.equal(r.body.analysis.confidence, 'Medium');
    setAiClient(null);
  });
});
