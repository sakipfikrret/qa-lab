import React, { useState } from 'react';
import { 
  PlayCircle, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  X,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  Check
} from 'lucide-react';
import { TestRun, TestCase, Project } from '../../types/qa';
import { useEscapeKey } from '../../lib/useEscapeKey';

interface TestRunsViewProps {
  project: Project;
  testRuns: TestRun[];
  testCases: TestCase[];
  onSelectRun: (runId: string) => void;
  onCreateRun: (data: { name: string; environment: string; testCaseIds: string[] }) => Promise<void>;
}

export const TestRunsView: React.FC<TestRunsViewProps> = ({
  project,
  testRuns,
  testCases,
  onSelectRun,
  onCreateRun,
}) => {
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  useEscapeKey(showNewRunModal, () => setShowNewRunModal(false));
  const [runName, setRunName] = useState(`Release Verification Suite - ${new Date().toLocaleDateString()}`);
  const [environment, setEnvironment] = useState<'Staging' | 'Production' | 'Preview' | 'Local'>('Staging');
  const [selectedCaseIds, setSelectedCaseIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    testCases.forEach(tc => { map[tc.id] = true; });
    return map;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const caseIds = Object.keys(selectedCaseIds).filter(k => selectedCaseIds[k]);
    if (caseIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreateRun({
        name: runName.trim(),
        environment,
        testCaseIds: caseIds,
      });
      setShowNewRunModal(false);
    } catch (err) {
      console.error('Failed to create run:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Test Execution Runs</h1>
            <span className="font-mono text-xs text-neutral-300">({testRuns.length} recorded)</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Manual and automated execution sessions, step-level verification, and failure telemetry
          </p>
        </div>

        <button
          onClick={() => setShowNewRunModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm active:scale-[0.98]"
        >
          <PlayCircle className="h-3.5 w-3.5 text-neutral-900" />
          <span>Launch New Test Run</span>
        </button>
      </div>

      {/* Test Runs Table */}
      <div className="rounded-lg craft-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#12151c] border-b border-white/[0.07] text-xs uppercase tracking-wider text-neutral-300 font-mono">
            <tr>
              <th className="py-2.5 px-4 w-36">Run Session ID</th>
              <th className="py-2.5 px-4">Suite Description & Target</th>
              <th className="py-2.5 px-4 w-28">Environment</th>
              <th className="py-2.5 px-4 w-32">Status</th>
              <th className="py-2.5 px-4 w-28">Pass Rate</th>
              <th className="py-2.5 px-4 w-28">Duration</th>
              <th className="py-2.5 px-4 w-24 text-right">Execute</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {testRuns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-300">
                  No test execution runs found. Click "Launch New Test Run" to start.
                </td>
              </tr>
            ) : (
              testRuns.map((run) => {
                const isPassed = run.status === 'Passed';
                const isFailed = run.status === 'Failed';
                const passRate = run.summary?.passRate || 0;

                return (
                  <tr
                    key={run.id}
                    onClick={() => onSelectRun(run.id)}
                    className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-white group-hover:text-accent-300 transition-colors">
                      {run.runId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-100 group-hover:text-white transition-colors">
                        {run.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
                        <span>Started: {new Date(run.startTime).toLocaleTimeString()}</span>
                        <span>·</span>
                        <span>{run.testCaseIds.length} test cases</span>
                        <span>·</span>
                        <span>Target: {run.environment}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-neutral-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] text-xs">
                        {run.environment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isPassed ? 'bg-emerald-400' : isFailed ? 'bg-rose-500' : 'bg-amber-400'
                        }`} />
                        <span className={`text-xs font-mono font-medium ${
                          isPassed ? 'text-emerald-400' : isFailed ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <span>{passRate}%</span>
                        <span className="text-[11px] text-neutral-300">
                          ({run.summary?.passed || 0}/{run.summary?.total || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neutral-300 text-xs">
                      {run.duration || 'Running'}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectRun(run.id)}
                        className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                        title="Enter Execution Runner"
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

      {/* New Run Modal */}
      {showNewRunModal && (
        <div role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-xl rounded-xl craft-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Configure New Test Run</h3>
                <p className="text-xs text-neutral-300 mt-0.5">Define target environment and test case scope</p>
              </div>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="text-neutral-300 hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="testrunsview-f1" className="block text-neutral-300 font-semibold mb-1">Suite Name</label>
                <input id="testrunsview-f1"
                  type="text"
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#101217] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
                />
              </div>

              <div>
                <label htmlFor="testrunsview-f2" className="block text-neutral-300 font-semibold mb-1">Target Environment</label>
                <select id="testrunsview-f2"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#101217] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
                >
                  <option value="Staging">Staging (staging.app.internal)</option>
                  <option value="Preview">Preview Deployment (Vercel / PR branch)</option>
                  <option value="Production">Production (Sanity verification)</option>
                  <option value="Local">Local Development (localhost:3000)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-neutral-300 font-semibold">
                    Test Cases Scope ({Object.values(selectedCaseIds).filter(Boolean).length} of {testCases.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const m: Record<string, boolean> = {};
                        testCases.forEach(t => { m[t.id] = true; });
                        setSelectedCaseIds(m);
                      }}
                      className="text-xs text-neutral-300 hover:text-white"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-600">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCaseIds({})}
                      className="text-xs text-neutral-300 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-md border border-white/[0.08] bg-[#0d0e13] p-2 space-y-1">
                  {testCases.map((tc) => (
                    <label 
                      key={tc.id} 
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-white/[0.04] cursor-pointer text-neutral-300"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(selectedCaseIds[tc.id])}
                        onChange={() => {
                          setSelectedCaseIds(prev => ({ ...prev, [tc.id]: !prev[tc.id] }));
                        }}
                        className="rounded border-neutral-700 bg-neutral-900 text-accent-500 focus:ring-0"
                      />
                      <span className="font-mono text-xs text-neutral-300">{tc.code}</span>
                      <span className="truncate">{tc.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRunModal(false)}
                  className="px-3 py-1.5 text-neutral-300 hover:text-white rounded-md border border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Object.values(selectedCaseIds).filter(Boolean).length === 0}
                  className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Starting...' : 'Launch Runner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
