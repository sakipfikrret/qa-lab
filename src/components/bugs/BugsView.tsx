import React, { useState } from 'react';
import { 
  Bug as BugIcon, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Bug, BugSeverity, BugStatus, Project } from '../../types/qa';
import { BugDetailModal } from './BugDetailModal';

interface BugsViewProps {
  project: Project;
  bugs: Bug[];
  selectedBugId?: string;
  onUpdateBug: (id: string, updates: Partial<Bug> & { note?: string }) => Promise<void>;
  onNavigateToAnalysis: () => void;
}

export const BugsView: React.FC<BugsViewProps> = ({
  project,
  bugs,
  selectedBugId,
  onUpdateBug,
  onNavigateToAnalysis,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeBug, setActiveBug] = useState<Bug | null>(() => {
    return selectedBugId ? bugs.find(b => b.id === selectedBugId) || null : null;
  });

  const filteredBugs = bugs.filter((bug) => {
    const matchesSearch = 
      bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.bugId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bug.probableCause && bug.probableCause.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || bug.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || bug.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const severities: BugSeverity[] = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'];
  const statuses: BugStatus[] = ['Open', 'In Progress', 'Fixed', 'Retest', 'Closed', 'Rejected'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Engineering Defect Tracker</h1>
            <span className="font-mono text-xs text-neutral-300">({bugs.length} recorded)</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Grounded bug reports generated from verified test execution failures and AI forensic triage
          </p>
        </div>

        <button
          onClick={onNavigateToAnalysis}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-all shadow-xs"
        >
          <span>Failure Triage</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-lg craft-card">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by defect ID, title, or root cause..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-400"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-neutral-300 focus:outline-none focus:border-white/[0.2]"
          >
            <option value="all">All Severities</option>
            {severities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-neutral-300 focus:outline-none focus:border-white/[0.2]"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="text-xs text-neutral-300 font-mono text-right shrink-0">
          Showing {filteredBugs.length} of {bugs.length}
        </div>
      </div>

      {/* Bugs Table */}
      <div className="rounded-lg craft-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#12151c] border-b border-white/[0.07] text-xs uppercase tracking-wider text-neutral-300 font-mono">
            <tr>
              <th className="py-2.5 px-4 w-28">Defect ID</th>
              <th className="py-2.5 px-4">Title & Diagnosis</th>
              <th className="py-2.5 px-4 w-28">Severity</th>
              <th className="py-2.5 px-4 w-28">Status</th>
              <th className="py-2.5 px-4 w-32">Environment</th>
              <th className="py-2.5 px-4 w-32">Assignee</th>
              <th className="py-2.5 px-4 w-20 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredBugs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-300">
                  No defect reports match current filter criteria.
                </td>
              </tr>
            ) : (
              filteredBugs.map((bug) => {
                const isCritical = bug.severity === 'Critical' || bug.severity === 'Blocker';
                return (
                  <tr
                    key={bug.id}
                    onClick={() => setActiveBug(bug)}
                    className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {bug.bugId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-100 group-hover:text-white transition-colors">
                        {bug.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
                        <span className="line-clamp-1">{bug.probableCause || 'Awaiting triage'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-medium ${
                        isCritical ? 'text-rose-400' : bug.severity === 'Major' ? 'text-amber-400' : 'text-neutral-300'
                      }`}>
                        {bug.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono text-neutral-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                        {bug.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300 text-xs">
                      {bug.environment}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 text-xs">
                      {bug.assignedTo || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveBug(bug)}
                        className="p-1 text-neutral-300 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                        title="View defect report"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bug Detail Modal */}
      {activeBug && (
        <BugDetailModal
          bug={activeBug}
          isOpen={Boolean(activeBug)}
          onClose={() => setActiveBug(null)}
          onUpdateBug={async (id, updates) => {
            await onUpdateBug(id, updates);
            setActiveBug(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}
    </div>
  );
};
