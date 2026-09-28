import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Cpu,
  Layers,
  Loader2,
  BrainCircuit,
  Lock
} from 'lucide-react';
import { api, AuthUser } from '../../services/api';

interface SettingsViewProps {
  hasGeminiKey: boolean;
  user: AuthUser;
  onDataReset: () => Promise<void>;
  stats: {
    projectsCount: number;
    testCasesCount: number;
    testRunsCount: number;
    bugsCount: number;
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  hasGeminiKey,
  user,
  onDataReset,
  stats,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const isAdmin = user.role === 'admin';
  const [team, setTeam] = useState<AuthUser[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member');
  const [teamMsg, setTeamMsg] = useState<string | null>(null);

  useEffect(() => { api.listUsers().then(setTeam).catch(() => {}); }, []);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamMsg(null);
    try {
      const created = await api.createUser({ name: newName, email: newEmail, password: newPassword, role: newRole });
      setTeam(prev => [...prev, created]);
      setNewName(''); setNewEmail(''); setNewPassword('');
      setTeamMsg(`Added ${created.name}. Share the password with them securely.`);
    } catch (err: any) {
      setTeamMsg(err.message);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all QA//LAB data back to pristine baseline state? Any newly created projects or runs will be refreshed.')) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);
    try {
      await onDataReset();
      setResetMessage('Baseline dataset successfully restored.');
    } catch (err: any) {
      setResetMessage(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-white/[0.08]">
        <h1 className="text-xl font-semibold tracking-tight text-white">System Settings & Engine Status</h1>
        <p className="text-xs text-neutral-300 mt-1">
          Backend runtime health, Gemini model telemetry, and entity persistence
        </p>
      </div>

      {/* Model & AI Runtime Status */}
      <div className="craft-card rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-accent-400" />
            <h2 className="text-sm font-semibold text-white">AI Engine Configuration</h2>
          </div>
          <span className="text-xs font-mono text-neutral-300">@google/genai</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-md bg-[#101217] border border-white/[0.06] space-y-1">
            <span className="text-neutral-300 font-mono text-xs">Primary Model Target</span>
            <div className="text-sm font-semibold text-white font-mono">GEMINI_MODEL (server env)</div>
            <p className="text-xs text-neutral-300 mt-1">
              Active for requirement risk auditing, test synthesis, and forensic failure triage.
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-[#101217] border border-white/[0.06] space-y-1">
            <span className="text-neutral-300 font-mono text-xs">API Key Provisioning</span>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${hasGeminiKey ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              <span className="text-sm font-semibold text-white font-mono">
                {hasGeminiKey ? 'Connected (Cloud)' : 'Local Deterministic Fallback'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              {hasGeminiKey
                ? 'Active environment credential detected on server process.'
                : 'Using deterministic heuristic engine. Provide GEMINI_API_KEY for live reasoning.'}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06] text-xs text-neutral-300 leading-relaxed flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-neutral-300 block mb-0.5">Architecture & Key Safety</span>
            All AI interactions are securely executed via server-side endpoints (<code className="font-mono text-neutral-200">/api/*</code>). Secrets are never exposed to browser bundles or client DOM.
          </div>
        </div>
      </div>

      {/* Dataset & Storage Management */}
      <div className="craft-card rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-neutral-300" />
            <h2 className="text-sm font-semibold text-white">Workspace Storage State</h2>
          </div>
          <span className="text-xs text-neutral-300 font-mono">Active Records</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
            <div className="text-lg font-bold font-mono text-white">{stats.projectsCount}</div>
            <div className="text-xs text-neutral-300 font-mono mt-0.5">Projects</div>
          </div>
          <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
            <div className="text-lg font-bold font-mono text-white">{stats.testCasesCount}</div>
            <div className="text-xs text-neutral-300 font-mono mt-0.5">Test Cases</div>
          </div>
          <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
            <div className="text-lg font-bold font-mono text-white">{stats.testRunsCount}</div>
            <div className="text-xs text-neutral-300 font-mono mt-0.5">Test Runs</div>
          </div>
          <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
            <div className="text-lg font-bold font-mono text-white">{stats.bugsCount}</div>
            <div className="text-xs text-neutral-300 font-mono mt-0.5">Defects</div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-200">Restore Baseline Demo Dataset</div>
            <p className="text-xs text-neutral-300">Restore default demo projects, test cases, and runs.</p>
          </div>

          <button
            onClick={handleReset}
            hidden={!isAdmin}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors"
          >
            {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            <span>Reset Demo Data</span>
          </button>
        </div>

        {resetMessage && (
          <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-neutral-300 font-mono">
            {resetMessage}
          </div>
        )}
      </div>

      {/* Team */}
      <div className="craft-card rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Team</h2>
        <ul className="divide-y divide-white/[0.06] text-xs">
          {team.map(u => (
            <li key={u.id} className="py-2 flex items-center justify-between">
              <span className="text-neutral-200">{u.name} <span className="text-neutral-400">· {u.email}</span></span>
              <span className="font-mono text-neutral-300">{u.role}</span>
            </li>
          ))}
        </ul>
        {isAdmin ? (
          <form onSubmit={addMember} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input aria-label="Name" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} required className="rounded-md bg-white/[0.04] border border-white/[0.12] px-2.5 py-1.5 text-white" />
            <input aria-label="Email" type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="rounded-md bg-white/[0.04] border border-white/[0.12] px-2.5 py-1.5 text-white" />
            <input aria-label="Temporary password" type="password" placeholder="Temporary password (min. 10)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={10} className="rounded-md bg-white/[0.04] border border-white/[0.12] px-2.5 py-1.5 text-white" />
            <select aria-label="Role" value={newRole} onChange={e => setNewRole(e.target.value as 'member' | 'admin')} className="rounded-md bg-neutral-900 border border-white/[0.12] px-2.5 py-1.5 text-white">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="sm:col-span-2 px-3 py-1.5 font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md">Add team member</button>
            {teamMsg && <p role="status" className="sm:col-span-2 text-neutral-300">{teamMsg}</p>}
          </form>
        ) : (
          <p className="text-xs text-neutral-300">Only admins can add people or reset demo data.</p>
        )}
      </div>
    </div>
  );
};
