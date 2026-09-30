import type { Store } from './db';
import type { PublicUser } from './auth';

export type ProjectRole = 'owner' | 'editor' | 'viewer';
export const PROJECT_ROLES: readonly ProjectRole[] = ['owner', 'editor', 'viewer'];
const RANK: Record<ProjectRole, number> = { viewer: 1, editor: 2, owner: 3 };

/** Workspace admins are implicit owners of every project; everyone else needs a membership row. */
export function roleFor(store: Store, user: PublicUser | undefined, projectId: string | undefined): ProjectRole | null {
  if (!user || !projectId) return null;
  if (user.role === 'admin') return 'owner';
  const r = store.db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, user.id) as { role: ProjectRole } | undefined;
  return r?.role ?? null;
}

export function can(store: Store, user: PublicUser | undefined, projectId: string | undefined, need: ProjectRole): boolean {
  const r = roleFor(store, user, projectId);
  return r !== null && RANK[r] >= RANK[need];
}

/** `null` means "every project" (admin). */
export function readableProjectIds(store: Store, user: PublicUser | undefined): Set<string> | null {
  if (!user) return new Set();
  if (user.role === 'admin') return null;
  const rows = store.db.prepare('SELECT project_id FROM project_members WHERE user_id = ?').all(user.id) as { project_id: string }[];
  return new Set(rows.map(r => r.project_id));
}

export function filterReadable<T extends { projectId: string }>(store: Store, user: PublicUser | undefined, items: T[]): T[] {
  const ids = readableProjectIds(store, user);
  return ids === null ? items : items.filter(i => ids.has(i.projectId));
}

export interface MemberRow { userId: string; name: string; email: string; role: ProjectRole }

export function listMembers(store: Store, projectId: string): MemberRow[] {
  return (store.db.prepare(
    'SELECT u.id AS userId, u.name, u.email, m.role FROM project_members m JOIN users u ON u.id = m.user_id WHERE m.project_id = ? ORDER BY u.name'
  ).all(projectId)) as unknown as MemberRow[];
}

export function setMember(store: Store, projectId: string, userId: string, role: ProjectRole) {
  store.db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?) ON CONFLICT(project_id, user_id) DO UPDATE SET role = excluded.role'
  ).run(projectId, userId, role);
}

export function removeMember(store: Store, projectId: string, userId: string) {
  store.db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
}
