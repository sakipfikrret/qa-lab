import React from 'react';
import { 
  CheckSquare, 
  PlayCircle, 
  Bug as BugIcon, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Plus,
  GitBranch,
  ArrowRight,
  TrendingUp,
  Cpu,
  Terminal,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Project, TestCase, TestRun, Bug, QAInsight } from '../../types/qa';

interface DashboardViewProps {
  projects: Project[];
  testCases: TestCase[];
  testRuns: TestRun[];
  bugs: Bug[];
  insights: QAInsight[];
  onNavigate: (tab: string, context?: any) => void;
  onOpenNewRun: () => void;
  onOpenNewProject: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  testCases,
  testRuns,
  bugs,
  insights,
  onNavigate,
  onOpenNewRun,
  onOpenNewProject,
}) => {
  const activeProjectsCount = projects.length;
  const totalTestCasesCount = testCases.length;

  // Aggregate results across latest test runs
  let totalExecuted = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalBlocked = 0;
  let totalSkipped = 0;

  testRuns.forEach(run => {
    if (run.summary) {
      totalExecuted += (run.summary.passed + run.summary.failed + run.summary.blocked + run.summary.skipped);
      totalPassed += run.summary.passed;
      totalFailed += run.summary.failed;
      totalBlocked += run.summary.blocked;
      totalSkipped += run.summary.skipped;
    }
  });

  const passRate = totalExecuted > 0 ? Math.round((totalPassed / totalExecuted) * 100) : 0;
  const openBugs = bugs.filter(b => b.status === 'Open' || b.status === 'In Progress');
  const criticalIssuesCount = bugs.filter(b => (b.severity === 'Critical' || b.severity === 'Blocker') && b.status !== 'Closed').length;

  const passedPct = totalExecuted > 0 ? Math.round((totalPassed / totalExecuted) * 100) : 0;
  const failedPct = totalExecuted > 0 ? Math.round((totalFailed / totalExecuted) * 100) : 0;
  const blockedPct = totalExecuted > 0 ? Math.max(0, 100 - passedPct - failedPct) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Editorial Quality Ops Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Quality Engineering Console</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300 mt-1">
            <span>Workspace: {projects[0]?.name || 'Primary'}</span>
            <span>·</span>
            <span>{totalTestCasesCount} active specifications</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('testcases', { focusDesigner: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] rounded-md transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-neutral-300" />
            <span>Design New Tests</span>
          </button>

          <button
            onClick={onOpenNewRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm active:scale-[0.98]"
          >
            <PlayCircle className="h-3.5 w-3.5 text-neutral-900" />
            <span>Execute Test Run</span>
          </button>
        </div>
      </div>

      {/* Unified Quality KPI Ribbon (Linear-style integrated metrics surface) */}
      <div className="craft-card rounded-lg p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.07]">
          {/* Metric 1: Pass Rate & Trend */}
          <div className="px-2 md:px-4 py-2 first:pl-0">
            <div className="flex items-center justify-between text-neutral-300 text-xs mb-1.5">
              <span className="font-medium">Suite Pass Rate</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{passRate}%</span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              {totalPassed} of {totalExecuted} checks passed
            </p>
          </div>

          {/* Metric 2: Open Defects & Blockers */}
          <div className="px-2 md:px-4 py-2">
            <div className="flex items-center justify-between text-neutral-300 text-xs mb-1.5">
              <span className="font-medium">Active Defects</span>
              <BugIcon className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{openBugs.length}</span>
              {criticalIssuesCount > 0 && (
                <span className="text-[11px] text-rose-400 font-mono px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  {criticalIssuesCount} blocker
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              {criticalIssuesCount === 0 ? 'Zero critical blockers' : 'Requires immediate patch triage'}
            </p>
          </div>

          {/* Metric 3: Test Coverage & Specifications */}
          <div className="px-2 md:px-4 py-2">
            <div className="flex items-center justify-between text-neutral-300 text-xs mb-1.5">
              <span className="font-medium">Total Specifications</span>
              <CheckSquare className="h-3.5 w-3.5 text-neutral-300" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{totalTestCasesCount}</span>
              <span className="text-xs text-neutral-300 font-mono">cases</span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              Across {activeProjectsCount} workspace modules
            </p>
          </div>

          {/* Metric 4: Triage & Audit Status */}
          <div className="px-2 md:px-4 py-2 last:pr-0">
            <div className="flex items-center justify-between text-neutral-300 text-xs mb-1.5">
              <span className="font-medium">Quality Risk Audits</span>
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{insights.length}</span>
              <span className="text-xs text-neutral-300">findings</span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              Automated requirement audits
            </p>
          </div>
        </div>

        {/* High-Resolution Test Health Bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-neutral-300 font-medium">Recorded Execution Health</span>
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Passed {passedPct}%
              </span>
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Failed {failedPct}%
              </span>
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Blocked {blockedPct}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full bg-[#1e222d] rounded-full overflow-hidden flex">
            <div style={{ width: `${passedPct}%` }} className="bg-emerald-500 transition-all duration-500" />
            <div style={{ width: `${failedPct}%` }} className="bg-rose-500 transition-all duration-500" />
            <div style={{ width: `${blockedPct}%` }} className="bg-amber-500 transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Test Runs & Defect Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Test Executions */}
        <div className="craft-card rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] mb-3">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-neutral-300" />
                <h3 className="text-sm font-semibold text-white">Recent Test Runs</h3>
              </div>
              <button
                onClick={() => onNavigate('runs')}
                className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View all runs</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {testRuns.slice(0, 3).map((run) => {
                const isFailed = run.status === 'Failed';
                const isPassed = run.status === 'Passed';
                return (
                  <div 
                    key={run.id}
                    onClick={() => onNavigate('runs', { selectedRunId: run.id })}
                    className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-md cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white group-hover:text-accent-300 transition-colors">
                          {run.runId}
                        </span>
                        <span className="text-neutral-300 text-xs">·</span>
                        <span className="text-xs text-neutral-300 font-mono">{run.environment}</span>
                      </div>
                      <div className="text-xs text-neutral-200 mt-0.5">{run.name}</div>
                      <div className="flex items-center gap-2 text-xs text-neutral-300 mt-1">
                        <span>Duration: {run.duration || '4.2s'}</span>
                        <span>·</span>
                        <span>{run.summary?.passed || 0}/{run.summary?.total || 0} checks passed</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          isPassed ? 'bg-emerald-400' : isFailed ? 'bg-rose-500' : 'bg-amber-400'
                        }`} />
                        <span className={`text-xs font-mono font-medium ${
                          isPassed ? 'text-emerald-400' : isFailed ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-neutral-300 mt-0.5">
                        {run.summary?.passRate || 0}% rate
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] mt-2">
            <button
              onClick={onOpenNewRun}
              className="w-full py-1.5 text-xs text-neutral-300 hover:text-neutral-200 hover:bg-white/[0.03] border border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-md text-center transition-all"
            >
              + Launch new test run execution
            </button>
          </div>
        </div>

        {/* Defect Triage & Open Issues */}
        <div className="craft-card rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] mb-3">
              <div className="flex items-center gap-2">
                <BugIcon className="h-4 w-4 text-neutral-300" />
                <h3 className="text-sm font-semibold text-white">Defect Investigations</h3>
              </div>
              <button
                onClick={() => onNavigate('bugs')}
                className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View all defects</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {bugs.slice(0, 3).map((bug) => (
                <div 
                  key={bug.id}
                  onClick={() => onNavigate('bugs', { selectedBugId: bug.id })}
                  className="py-3 flex items-start justify-between hover:bg-white/[0.02] px-2 rounded-md cursor-pointer transition-colors group"
                >
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {bug.bugId}
                      </span>
                      <span className="text-neutral-300 text-xs">·</span>
                      <span className={`text-xs font-medium ${
                        bug.severity === 'Critical' || bug.severity === 'Blocker' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {bug.severity}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-200 mt-0.5 line-clamp-1">{bug.title}</div>
                    <div className="text-xs text-neutral-300 mt-1 line-clamp-1">
                      {bug.probableCause || 'Awaiting deep forensic triage'}
                    </div>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <span className="text-xs font-mono text-neutral-300 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      {bug.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] mt-2">
            <button
              onClick={() => onNavigate('analysis')}
              className="w-full py-1.5 text-xs text-neutral-300 hover:text-neutral-200 hover:bg-white/[0.03] border border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-md text-center transition-all"
            >
              Analyze new execution failure
            </button>
          </div>
        </div>
      </div>

      {/* Engineering Risk & Specification Insights (Handcrafted Editorial Layout) */}
      <div className="craft-card rounded-lg p-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07] mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Quality Engineering Audit Findings</h3>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Automated audits identifying specification ambiguity, missing negative assertions, and regression risk
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-300">
            {insights.length} active advisories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins) => (
            <div 
              key={ins.id} 
              className="p-3.5 rounded-md bg-[#161921]/90 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-neutral-300 font-mono text-xs">{ins.category}</span>
                  <span className={`text-xs font-medium ${
                    ins.severity === 'Critical' ? 'text-rose-400' : ins.severity === 'High' ? 'text-amber-400' : 'text-neutral-300'
                  }`}>
                    {ins.severity}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-neutral-100 mb-1.5 leading-snug">{ins.title}</h4>
                <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">{ins.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                <div className="text-[11px] uppercase font-mono tracking-wider text-accent-400/90 mb-0.5">
                  Action Recommendation:
                </div>
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">{ins.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
