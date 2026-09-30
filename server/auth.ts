import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { Store } from './db';

export type Role = 'admin' | 'member';
export interface PublicUser { id: string; email: string; name: string; role: Role; createdAt: string }

const SESSION_DAYS = 14;
export const COOKIE_NAME = 'qalab_session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: PublicUser } }
}

/* ---------- passwords (scrypt, per-user salt) ---------- */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(expected, actual);
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function validateCredentials(email: unknown, password: unknown, name?: unknown): string | null {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return 'A valid email is required';
  if (typeof password !== 'string' || password.length < 10) return 'Password must be at least 10 characters';
  if (password.length > 200) return 'Password is too long';
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1 || name.length > 80)) return 'Name must be 1-80 characters';
  return null;
}

/* ---------- users & sessions ---------- */
const toPublic = (r: any): PublicUser => ({ id: r.id, email: r.email, name: r.name, role: r.role, createdAt: r.created_at });

export function countUsers(store: Store): number {
  return (store.db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
}

export function listUsers(store: Store): PublicUser[] {
  return (store.db.prepare('SELECT * FROM users ORDER BY created_at').all() as any[]).map(toPublic);
}

export function createUser(store: Store, input: { email: string; name: string; password: string; role: Role }): PublicUser {
  const id = `usr-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  store.db.prepare('INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, input.email.trim().toLowerCase(), input.name.trim(), hashPassword(input.password), input.role, createdAt);
  return { id, email: input.email.trim().toLowerCase(), name: input.name.trim(), role: input.role, createdAt };
}

export function findUserByEmail(store: Store, email: string): (PublicUser & { passwordHash: string }) | null {
  const r = store.db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
  return r ? { ...toPublic(r), passwordHash: r.password_hash } : null;
}

export function createSession(store: Store, userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  store.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  store.db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha256(token), userId, expires);
  return token;
}

export function userFromToken(store: Store, token: string | undefined): PublicUser | null {
  if (!token) return null;
  const r = store.db.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).get(sha256(token), Date.now()) as any;
  return r ? toPublic(r) : null;
}

export function destroySession(store: Store, token: string | undefined) {
  if (token) store.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

/* ---------- http helpers ---------- */
export function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export function setSessionCookie(res: Response, token: string, secure: boolean) {
  res.append('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`);
}
export function clearSessionCookie(res: Response) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite=Lax). */
export function sameOriginGuard(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'Cross-origin request blocked' });
    } catch { return res.status(403).json({ error: 'Bad origin' }); }
  }
  next();
}

/** Sliding-window limiter keyed by an arbitrary string. */
export function makeLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) { hits.set(key, arr); return false; }
    arr.push(now); hits.set(key, arr);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
    return true;
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

/* ---------- password management ---------- */
const RESET_MINUTES = 60;

export function findUserById(store: Store, id: string): (PublicUser & { passwordHash: string }) | null {
  const r = store.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  return r ? { ...toPublic(r), passwordHash: r.password_hash } : null;
}

export function countAdmins(store: Store): number {
  return (store.db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
}

export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 10) return 'Password must be at least 10 characters';
  if (password.length > 200) return 'Password is too long';
  return null;
}

/** Sets a new password and revokes every existing session of that user. */
export function setPassword(store: Store, userId: string, newPassword: string) {
  store.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), userId);
  store.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  store.db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(userId);
}

/** One-time reset token (valid 60 min). Only its hash is stored. */
export function createResetToken(store: Store, userId: string): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + RESET_MINUTES * 60_000;
  store.db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?').run(userId, Date.now());
  store.db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha256(token), userId, expiresAt);
  return { token, expiresAt };
}

export function consumeResetToken(store: Store, token: string, newPassword: string): PublicUser | null {
  const row = store.db.prepare('SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > ?').get(sha256(token), Date.now()) as any;
  if (!row) return null;
  setPassword(store, row.user_id, newPassword);
  const u = findUserById(store, row.user_id);
  if (!u) return null;
  const { passwordHash, ...pub } = u;
  return pub;
}

export type UserChangeResult = 'ok' | 'not_found' | 'last_admin';

export function changeUserRole(store: Store, userId: string, role: Role): UserChangeResult {
  const u = findUserById(store, userId);
  if (!u) return 'not_found';
  if (u.role === 'admin' && role !== 'admin' && countAdmins(store) <= 1) return 'last_admin';
  store.db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  return 'ok';
}

export function deleteUser(store: Store, userId: string): UserChangeResult {
  const u = findUserById(store, userId);
  if (!u) return 'not_found';
  if (u.role === 'admin' && countAdmins(store) <= 1) return 'last_admin';
  store.db.prepare('DELETE FROM users WHERE id = ?').run(userId); // sessions, resets, memberships cascade
  return 'ok';
}
