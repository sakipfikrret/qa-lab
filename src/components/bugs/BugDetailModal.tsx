import React, { useState } from 'react';
import { 
  X, 
  Bug as BugIcon, 
  Clock, 
  User, 
  ShieldAlert, 
  Terminal, 
  Check, 
  ArrowRight,
  GitBranch,
  Edit2,
  Save,
  Copy,
  ExternalLink,
  BrainCircuit
} from 'lucide-react';
import { Bug, BugStatus, BugSeverity, Priority } from '../../types/qa';
import { useEscapeKey } from '../../lib/useEscapeKey';

interface BugDetailModalProps {
  bug: Bug | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBug: (id: string, updates: Partial<Bug> & { note?: string }) => Promise<void>;
}

export const BugDetailModal: React.FC<BugDetailModalProps> = ({
  bug,
  isOpen,
  onClose,
  onUpdateBug,
}) => {
  useEscapeKey(isOpen, onClose);
  if (!isOpen || !bug) return null;

  const [status, setStatus] = useState<BugStatus>(bug.status);
  const [assignedTo, setAssignedTo] = useState(bug.assignedTo || 'Unassigned');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const statuses: BugStatus[] = ['Open', 'In Progress', 'Fixed', 'Retest', 'Closed', 'Rejected'];

  const handleApplyStatusChange = async (newStatus: BugStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateBug(bug.id, {
        status: newStatus,
        note: statusNote || undefined,
      });
      setStatus(newStatus);
      setStatusNote('');
    } catch (err) {
      console.error('Failed to update bug status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    setIsUpdating(true);
    try {
      await onUpdateBug(bug.id, {
        assignedTo: newAssignee,
      });
      setAssignedTo(newAssignee);
    } catch (err) {
      console.error('Failed to update assignee:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `## [${bug.bugId}] ${bug.title}
**Severity**: ${bug.severity} | **Environment**: ${bug.environment} | **Status**: ${bug.status}

### Preconditions
${bug.preconditions || 'None'}

### Steps to Reproduce
${bug.stepsToReproduce.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

### Expected Result
${bug.expectedBehavior}

### Actual Result
${bug.actualBehavior}

### Root Cause
${bug.probableCause || 'Under Investigation'}

### Fix Recommendation
${bug.suggestedFixDirection || 'Not provided'}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="w-full max-w-3xl rounded-xl craft-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                {bug.bugId}
              </span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className={`text-xs font-medium ${
                bug.severity === 'Critical' || bug.severity === 'Blocker' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {bug.severity}
              </span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-xs font-mono text-neutral-300">{bug.environment}</span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-xs text-neutral-300 font-mono">Status: {bug.status}</span>
            </div>

            <h2 className="text-base font-semibold text-white pt-1">{bug.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-all"
              title="Copy formatted markdown for Linear or GitHub Issue"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button onClick={onClose} className="text-neutral-300 hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Transition Control Bar */}
        <div className="p-3 rounded-lg bg-[#101217] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-300 font-mono text-xs">Workflow State:</span>
            <div className="flex flex-wrap items-center gap-1">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleApplyStatusChange(s)}
                  disabled={isUpdating}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    status === s
                      ? 'bg-white/[0.12] border-white/[0.2] text-white font-medium shadow-xs'
                      : 'border-white/[0.06] text-neutral-300 hover:text-neutral-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-300 font-mono text-xs">Assignee:</span>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              onBlur={() => handleAssigneeChange(assignedTo)}
              placeholder="e.g. Alex Chen"
              className="px-2.5 py-1 text-xs bg-[#0b0c10] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
            />
          </div>
        </div>

        {/* Core Bug Details */}
        <div className="space-y-4 text-xs">
          {/* Preconditions */}
          <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.06]">
            <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
              Preconditions:
            </span>
            <p className="text-neutral-300 leading-relaxed">{bug.preconditions || 'None'}</p>
          </div>

          {/* Steps to Reproduce */}
          <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.06] space-y-2">
            <span className="font-semibold text-neutral-300 block font-mono uppercase text-[11px]">
              Reproduction Steps:
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {bug.stepsToReproduce.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-neutral-300">
                  <span className="text-neutral-400 shrink-0">{idx + 1}.</span>
                  <span className="font-sans text-neutral-200">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.06]">
              <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
                Expected Result:
              </span>
              <p className="text-neutral-300 leading-relaxed">{bug.expectedBehavior}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-rose-500/[0.05] border border-rose-500/20">
              <span className="font-semibold text-rose-300 block mb-1 font-mono uppercase text-[11px]">
                Actual Result:
              </span>
              <p className="text-neutral-200 leading-relaxed">{bug.actualBehavior}</p>
            </div>
          </div>

          {/* Root Cause & Findings */}
          {bug.probableCause && (
            <div className="p-3.5 rounded-lg bg-[#141722] border border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-accent-400 font-mono text-xs mb-1">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Probable Root Cause</span>
              </div>
              <p className="text-neutral-300 leading-relaxed text-xs">
                {bug.probableCause}
              </p>
            </div>
          )}

          {/* Suggested Fix */}
          {bug.suggestedFixDirection && (
            <div className="p-3.5 rounded-lg bg-[#12151c] border border-white/[0.06]">
              <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
                Recommended Resolution:
              </span>
              <p className="text-neutral-300 leading-relaxed">{bug.suggestedFixDirection}</p>
            </div>
          )}

          {/* Associated Test Case and Result */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-neutral-300 text-xs font-mono">
            <span>Linked Test Case: {bug.testCaseId || 'Unlinked'}</span>
            <span>Reported on {new Date(bug.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
