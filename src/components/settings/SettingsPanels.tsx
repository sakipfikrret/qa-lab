import React, { useEffect, useState } from 'react';
import { api, AuthUser, ProjectMember } from '../../services/api';
import type { Project } from '../../types/qa';

const input = 'rounded-md bg-white/[0.04] border border-white/[0.12] px-2.5 py-1.5 text-white text-xs placeholder-neutral-500';
const select = 'rounded-md bg-neutral-900 border border-white/[0.12] px-2 py-1.5 text-white text-xs';
const primary = 'px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md disabled:opacity-60';
const ghost = 'px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-md';

export const AccountPanel: React.FC<{ user: AuthUser; authDisabled?: boolean }> = ({ user }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (user.id === 'local') return null; // local single-user mode has no password

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api.changePassword(current, next);
      setCurrent(''); setNext('');
      setMsg({ ok: true, text: 'Password changed. Your other devices were signed out.' });
    } catch (err: any) {
      setMsg({ ok: false, text: err.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="craft-card rounded-lg p-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">Account</h2>
      <p className="text-xs text-neutral-300">{user.name} · {user.email} · {user.role}</p>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
        <label className="text-xs text-neutral-300">Current password
          <input type="password" className={`${input} w-full mt-1`} value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="text-xs text-neutral-300">New password (min. 10)
          <input type="password" className={`${input} w-full mt-1`} value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" minLength={10} required />
        </label>
        <button type="submit" disabled={busy} className={primary}>Change password</button>
      </form>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs ${msg.ok ? 'text-neutral-300' : 'text-rose-300'}`}>{msg.text}</p>}
    </div>
  );
};

export const TeamPanel: React.FC<{ user: AuthUser }> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [team, setTeam] = useState<AuthUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<{ userName: string; url: string; expiresAt: string } | null>(null);

  useEffect(() => { if (isAdmin) api.listUsers().then(setTeam).catch(() => {}); }, [isAdmin]);

  if (!isAdmin) return null;

  const run = async (fn: () => Promise<void>) => {
    setMsg(null);
    try { await fn(); } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="craft-card rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white">Team</h2>
      <ul className="divide-y divide-white/[0.06] text-xs">
        {team.map(u => (
          <li key={u.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-neutral-200">{u.name} <span className="text-neutral-400">· {u.email}</span></span>
            <span className="flex items-center gap-1.5">
              <select aria-label={`Role for ${u.name}`} className={select} value={u.role}
                onChange={e => run(async () => {
                  const updated = await api.setUserRole(u.id, e.target.value as 'admin' | 'member');
                  setTeam(t => t.map(x => (x.id === u.id ? updated : x)));
                })}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <button className={ghost} onClick={() => run(async () => {
                const r = await api.createResetLink(u.id);
                setLink({ userName: u.name, ...r });
              })}>Reset link</button>
              {u.id !== user.id && (
                <button className={`${ghost} hover:text-rose-300`} onClick={() => {
                  if (!window.confirm(`Remove ${u.name}? They lose access immediately.`)) return;
                  run(async () => { await api.deleteUser(u.id); setTeam(t => t.filter(x => x.id !== u.id)); });
                }}>Remove</button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {link && (
        <div role="status" className="text-xs border border-white/[0.12] rounded-md p-3 bg-white/[0.03] space-y-1.5">
          <div className="text-neutral-200">One-time password reset link for {link.userName} (expires {new Date(link.expiresAt).toLocaleTimeString()}). Send it to them privately:</div>
          <input readOnly aria-label="Reset link" className={`${input} w-full font-mono`} value={link.url} onFocus={e => e.currentTarget.select()} />
        </div>
      )}

      <form
        onSubmit={e => { e.preventDefault(); run(async () => {
          const created = await api.createUser({ name, email, password, role });
          setTeam(t => [...t, created]);
          setName(''); setEmail(''); setPassword('');
          setMsg(`Added ${created.name}. Give them access to projects below, and share the password securely.`);
        }); }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        <input aria-label="Name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className={input} />
        <input aria-label="Email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={input} />
        <input aria-label="Temporary password" type="password" placeholder="Temporary password (min. 10)" value={password} onChange={e => setPassword(e.target.value)} required minLength={10} className={input} />
        <select aria-label="Role" value={role} onChange={e => setRole(e.target.value as 'member' | 'admin')} className={select}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className={`sm:col-span-2 ${primary}`}>Add team member</button>
      </form>
      {msg && <p role="status" className="text-xs text-neutral-300">{msg}</p>}
    </div>
  );
};

export const ProjectAccessPanel: React.FC<{ project: Project }> = ({ project }) => {
  const canManage = project.myRole === 'owner';
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer' | 'owner'>('editor');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!project.id) return;
    api.listMembers(project.id).then(setMembers).catch(() => setMembers([]));
  }, [project.id]);

  if (!project.id) return null;

  const run = async (fn: () => Promise<ProjectMember[]>) => {
    setMsg(null);
    try { setMembers(await fn()); } catch (err: any) { setMsg(err.message); }
  };

  return (
    <div className="craft-card rounded-lg p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Access to “{project.name}”</h2>
        <p className="text-xs text-neutral-300 mt-1">
          Viewers can read, editors can change tests, runs and bugs, owners also manage access. Workspace admins can always see every project.
        </p>
      </div>
      {members.length === 0 ? (
        <p className="text-xs text-neutral-400">No one has been added yet.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06] text-xs">
          {members.map(m => (
            <li key={m.userId} className="py-2 flex items-center justify-between gap-2">
              <span className="text-neutral-200">{m.name} <span className="text-neutral-400">· {m.email}</span></span>
              <span className="flex items-center gap-1.5">
                {canManage ? (
                  <select aria-label={`Project role for ${m.name}`} className={select} value={m.role}
                    onChange={e => run(() => api.setMember(project.id, m.email, e.target.value as any))}>
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="owner">owner</option>
                  </select>
                ) : <span className="font-mono text-neutral-300">{m.role}</span>}
                {canManage && <button className={`${ghost} hover:text-rose-300`} onClick={() => run(() => api.removeMember(project.id, m.userId))}>Remove</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <form onSubmit={e => { e.preventDefault(); run(() => api.setMember(project.id, email, role)).then(() => setEmail('')); }} className="flex flex-wrap gap-2">
          <input aria-label="Member email" type="email" placeholder="teammate@company.com" value={email} onChange={e => setEmail(e.target.value)} required className={`${input} flex-1 min-w-[12rem]`} />
          <select aria-label="Project role" value={role} onChange={e => setRole(e.target.value as any)} className={select}>
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="owner">owner</option>
          </select>
          <button type="submit" className={primary}>Give access</button>
        </form>
      ) : (
        <p className="text-xs text-neutral-400">Only project owners can change access.</p>
      )}
      {msg && <p role="alert" className="text-xs text-rose-300">{msg}</p>}
    </div>
  );
};
