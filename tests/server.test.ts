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

let demoId = '';

describe('project access control', () => {
  test('a member with no membership sees nothing and gets 404s (not 403s)', async () => {
    demoId = (await admin.call('GET', '/api/projects')).body[0].id;
    assert.deepEqual((await member.call('GET', '/api/projects')).body, []);
    assert.equal((await member.call('GET', `/api/projects/${demoId}`)).status, 404);
    assert.deepEqual((await member.call('GET', '/api/bugs')).body, []);
    assert.deepEqual((await member.call('GET', '/api/test-cases')).body, []);
    assert.equal((await member.call('GET', `/api/test-cases?projectId=${demoId}`)).status, 404);
    assert.equal((await member.call('POST', '/api/copilot', { message: 'hi', projectId: demoId })).status, 404);
    assert.equal((await member.call('POST', '/api/test-cases', { title: 't', steps: [{ stepNumber: 1, action: 'a', expected: 'b' }], projectId: demoId })).status, 404);
  });

  test('viewer can read but not write; editor can write but not manage members', async () => {
    const add = await admin.call('PUT', `/api/projects/${demoId}/members`, { email: 'bob@lab.dev', role: 'viewer' });
    assert.equal(add.status, 200);
    assert.equal((await member.call('GET', `/api/projects/${demoId}`)).status, 200);
    assert.ok((await member.call('GET', '/api/projects')).body[0].myRole === 'viewer');
    const tc = (await member.call('GET', '/api/test-cases')).body[0];
    assert.equal((await member.call('PUT', `/api/test-cases/${tc.id}`, { title: 'nope' })).status, 403);
    assert.equal((await member.call('POST', '/api/test-runs', { projectId: demoId })).status, 403);

    await admin.call('PUT', `/api/projects/${demoId}/members`, { email: 'bob@lab.dev', role: 'editor' });
    assert.equal((await member.call('PUT', `/api/test-cases/${tc.id}`, { title: tc.title })).status, 200);
    assert.equal((await member.call('PUT', `/api/projects/${demoId}/members`, { email: 'ada@lab.dev', role: 'viewer' })).status, 403);
  });

  test('members created projects are owned by their creator and isolated from others', async () => {
    const mine = await member.call('POST', '/api/projects', { name: 'Bob private', type: 'API' });
    assert.equal(mine.status, 201);
    assert.equal(mine.body.myRole, 'owner');
    const tc = await member.call('POST', '/api/test-cases', { projectId: mine.body.id, title: 'mine', steps: [{ stepNumber: 1, action: 'a', expected: 'b' }] });
    assert.equal(tc.status, 201);
    // A second member never sees it
    await admin.call('POST', '/api/users', { email: 'eve@lab.dev', name: 'Eve', password: 'yet-another-passphrase' });
    const eve = new Jar();
    await eve.call('POST', '/api/auth/login', { email: 'eve@lab.dev', password: 'yet-another-passphrase' });
    assert.deepEqual((await eve.call('GET', '/api/projects')).body, []);
    assert.equal((await eve.call('GET', `/api/projects/${mine.body.id}`)).status, 404);
    // ...but admin sees everything
    assert.ok((await admin.call('GET', '/api/projects')).body.some((p: any) => p.id === mine.body.id));
  });

  test('members list is admin-only for users, owner-only for project members', async () => {
    assert.equal((await member.call('GET', '/api/users')).status, 403);
    assert.equal((await admin.call('GET', '/api/users')).status, 200);
    assert.equal((await member.call('GET', `/api/projects/${demoId}/members`)).status, 200);
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

  test('runs only include test cases of their own project and get unique sequential ids', async () => {
    const tcs = (await admin.call('GET', `/api/test-cases?projectId=${demoId}`)).body;
    const other = (await admin.call('POST', '/api/projects', { name: 'Other', type: 'API' })).body;
    const foreign = (await admin.call('POST', '/api/test-cases', { projectId: other.id, title: 'foreign', steps: [{ stepNumber: 1, action: 'a', expected: 'b' }] })).body;
    const r1 = await admin.call('POST', '/api/test-runs', { projectId: demoId, testCaseIds: [tcs[0].id, foreign.id] });
    assert.equal(r1.status, 201);
    assert.deepEqual(r1.body.testCaseIds, [tcs[0].id]);
    const r2 = await admin.call('POST', '/api/test-runs', { projectId: demoId, testCaseIds: [tcs[0].id] });
    assert.notEqual(r1.body.runId, r2.body.runId);
    assert.equal((await admin.call('POST', '/api/test-runs', { projectId: other.id, testCaseIds: [tcs[0].id] })).status, 400);
  });

  test('result submissions are validated', async () => {
    const tc = (await admin.call('GET', '/api/test-cases')).body.find((t: any) => t.projectId === demoId);
    const run = (await admin.call('POST', '/api/test-runs', { projectId: demoId, testCaseIds: [tc.id] })).body;
    const url = `/api/test-runs/${run.id}/results`;
    assert.equal((await admin.call('POST', url, { testCaseId: tc.id, status: 'Hacked' })).status, 400);
    assert.equal((await admin.call('POST', url, { testCaseId: 'not-in-run', status: 'Passed' })).status, 400);
    assert.equal((await admin.call('POST', url, { testCaseId: tc.id, status: 'Passed', stepResults: [{ stepNumber: 'x', status: 'PASS' }] })).status, 400);
    const ok = await admin.call('POST', url, { testCaseId: tc.id, status: 'Passed', stepResults: [{ stepNumber: 1, status: 'PASS' }] });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.run.summary.passed, 1);
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

  test('failure analysis without AI admits it found nothing', async () => {
    setAiClient(null);
    const tc = (await admin.call('GET', `/api/test-cases?projectId=${demoId}`)).body[0];
    const r = await admin.call('POST', '/api/failures/analyze', { testCase: tc, actualResult: 'boom' });
    assert.equal(r.body.isRealAI, false);
    assert.equal(r.body.analysis.confidence, 'Low');
    assert.match(r.body.analysis.probableCause, /Not determined/);
    assert.deepEqual(r.body.analysis.evidenceSupported, []);
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

describe('password management', () => {
  test('changing a password needs the current one and revokes other sessions', async () => {
    const a = new Jar(); const b = new Jar();
    await a.call('POST', '/api/auth/login', { email: 'eve@lab.dev', password: 'yet-another-passphrase' });
    await b.call('POST', '/api/auth/login', { email: 'eve@lab.dev', password: 'yet-another-passphrase' });
    assert.equal((await a.call('POST', '/api/auth/password', { currentPassword: 'wrong-wrong-wrong', newPassword: 'brand-new-passphrase' })).status, 403);
    assert.equal((await a.call('POST', '/api/auth/password', { currentPassword: 'yet-another-passphrase', newPassword: 'short' })).status, 400);
    assert.equal((await a.call('POST', '/api/auth/password', { currentPassword: 'yet-another-passphrase', newPassword: 'brand-new-passphrase' })).status, 200);
    assert.equal((await a.call('GET', '/api/projects')).status, 200); // current session re-issued
    assert.equal((await b.call('GET', '/api/projects')).status, 401); // other device signed out
    assert.equal((await new Jar().call('POST', '/api/auth/login', { email: 'eve@lab.dev', password: 'yet-another-passphrase' })).status, 401);
  });

  test('admin reset link is single-use, expires into a new password, and signs old sessions out', async () => {
    const users = (await admin.call('GET', '/api/users')).body;
    const eveId = users.find((u: any) => u.email === 'eve@lab.dev').id;
    assert.equal((await member.call('POST', `/api/users/${eveId}/reset-link`)).status, 403);
    const link = (await admin.call('POST', `/api/users/${eveId}/reset-link`)).body;
    const token = new URL(link.url).searchParams.get('reset')!;
    const fresh = new Jar();
    assert.equal((await fresh.call('POST', '/api/auth/reset', { token: 'f'.repeat(64), password: 'reset-passphrase-1' })).status, 400);
    assert.equal((await fresh.call('POST', '/api/auth/reset', { token, password: 'weak' })).status, 400);
    const ok = await fresh.call('POST', '/api/auth/reset', { token, password: 'reset-passphrase-1' });
    assert.equal(ok.status, 200);
    assert.equal((await fresh.call('GET', '/api/projects')).status, 200); // logged in by the reset
    assert.equal((await new Jar().call('POST', '/api/auth/reset', { token, password: 'reset-passphrase-2' })).status, 400); // single use
    assert.equal((await new Jar().call('POST', '/api/auth/login', { email: 'eve@lab.dev', password: 'reset-passphrase-1' })).status, 200);
  });

  test('last admin cannot be demoted or deleted; deleting a user cascades', async () => {
    const users = (await admin.call('GET', '/api/users')).body;
    const adaId = users.find((u: any) => u.email === 'ada@lab.dev').id;
    const bobId = users.find((u: any) => u.email === 'bob@lab.dev').id;
    assert.equal((await admin.call('PATCH', `/api/users/${adaId}`, { role: 'member' })).status, 409);
    assert.equal((await admin.call('DELETE', `/api/users/${adaId}`)).status, 409);
    assert.equal((await admin.call('PATCH', `/api/users/${bobId}`, { role: 'superuser' })).status, 400);
    assert.equal((await admin.call('DELETE', `/api/users/${bobId}`)).status, 200);
    assert.equal((await member.call('GET', '/api/projects')).status, 401); // deleted user's session is gone
    assert.equal((await admin.call('GET', `/api/projects/${demoId}/members`)).body.some((m: any) => m.email === 'bob@lab.dev'), false);
  });
});

describe('operations', () => {
  test('backup is admin-only and is a valid SQLite file', async () => {
    const eve = new Jar();
    await eve.call('POST', '/api/auth/login', { email: 'eve@lab.dev', password: 'reset-passphrase-1' });
    const denied = await fetch(base + '/api/admin/backup', { headers: { cookie: eve.cookie } });
    assert.equal(denied.status, 403);
    const res = await fetch(base + '/api/admin/backup', { headers: { cookie: admin.cookie } });
    assert.equal(res.status, 200);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.equal(buf.subarray(0, 15).toString(), 'SQLite format 3');
  });

  test('malformed JSON and unknown routes answer with JSON errors', async () => {
    const bad = await fetch(base + '/api/bugs', { method: 'POST', headers: { 'content-type': 'application/json', cookie: admin.cookie }, body: '{oops' });
    assert.equal(bad.status, 400);
    assert.deepEqual(await bad.json(), { error: 'Malformed JSON body' });
    const nf = await fetch(base + '/api/does-not-exist', { headers: { cookie: admin.cookie } });
    assert.equal(nf.status, 404);
    assert.deepEqual(await nf.json(), { error: 'Not found' });
  });
});
