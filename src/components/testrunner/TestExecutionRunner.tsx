import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Ban, 
  Upload, 
  FileText, 
  Terminal, 
  Globe, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2, 
  PlayCircle,
  Plus,
  Loader2,
  BrainCircuit,
  CornerDownRight,
  ShieldAlert
} from 'lucide-react';
import { computeResultStatus } from '../../lib/execution';
import { TestRun, TestCase, StepStatus, TestResult, Evidence } from '../../types/qa';
import { useEscapeKey } from '../../lib/useEscapeKey';

interface TestExecutionRunnerProps {
  testRun: TestRun;
  testCases: TestCase[];
  onBack: () => void;
  onUpdateRunResult: (testCaseId: string, resultData: Partial<TestResult>) => Promise<void>;
  onTriggerFailureAnalysis: (testCase: TestCase, result: TestResult) => void;
}

export const TestExecutionRunner: React.FC<TestExecutionRunnerProps> = ({
  testRun,
  testCases,
  onBack,
  onUpdateRunResult,
  onTriggerFailureAnalysis,
}) => {
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const activeTestCase = testCases[activeTestCaseIndex];
  const activeResult: TestResult = (activeTestCase && testRun.results[activeTestCase.id]) || {
    id: `res-${activeTestCase?.id}`,
    testRunId: testRun.id,
    testCaseId: activeTestCase?.id || '',
    status: 'Not Executed',
    executedAt: '',
    executedBy: 'Manual QA Operator',
    stepResults: activeTestCase ? activeTestCase.steps.map(s => ({ stepNumber: s.stepNumber, status: 'PENDING' as StepStatus })) : [],
    evidenceIds: [],
    evidenceList: [],
  };

  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>(() => {
    const map: Record<number, StepStatus> = {};
    if (activeTestCase) {
      activeTestCase.steps.forEach(s => {
        const found = activeResult.stepResults?.find(sr => sr.stepNumber === s.stepNumber);
        map[s.stepNumber] = found ? found.status : 'PENDING';
      });
    }
    return map;
  });

  const [actualResult, setActualResult] = useState(activeResult.actualResult || '');
  const [errorMessage, setErrorMessage] = useState(activeResult.errorMessage || '');
  const [executionNotes, setExecutionNotes] = useState(activeResult.notes || '');
  const [evidenceList, setEvidenceList] = useState<Evidence[]>(activeResult.evidenceList || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  useEscapeKey(showEvidenceModal, () => setShowEvidenceModal(false));
  const [evidenceType, setEvidenceType] = useState<Evidence['type']>('console_log');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceContent, setEvidenceContent] = useState('');

  const switchTestCase = (index: number) => {
    setActiveTestCaseIndex(index);
    const tc = testCases[index];
    if (tc) {
      const res = testRun.results[tc.id];
      const map: Record<number, StepStatus> = {};
      tc.steps.forEach(s => {
        const found = res?.stepResults?.find(sr => sr.stepNumber === s.stepNumber);
        map[s.stepNumber] = found ? found.status : 'PENDING';
      });
      setStepStatuses(map);
      setActualResult(res?.actualResult || '');
      setErrorMessage(res?.errorMessage || '');
      setExecutionNotes(res?.notes || '');
      setEvidenceList(res?.evidenceList || []);
    }
  };

  const handleStepStatusChange = (stepNumber: number, status: StepStatus) => {
    setStepStatuses(prev => ({ ...prev, [stepNumber]: status }));
  };

  const handleAddEvidence = () => {
    if (!evidenceContent.trim()) return;
    const newEvidence: Evidence = {
      id: `ev-${Date.now()}`,
      testResultId: activeResult.id,
      type: evidenceType,
      title: evidenceTitle.trim() || `${evidenceType.replace('_', ' ')} artifact`,
      content: evidenceContent.trim(),
      timestamp: new Date().toISOString(),
    };
    setEvidenceList(prev => [...prev, newEvidence]);
    setEvidenceTitle('');
    setEvidenceContent('');
    setShowEvidenceModal(false);
  };

  const handleSaveResult = async (overrideStatus?: TestResult['status']) => {
    if (!activeTestCase) return;
    setIsSaving(true);
    try {
      const stepResultsArray = activeTestCase.steps.map(s => ({
        stepNumber: s.stepNumber,
        status: overrideStatus === 'Passed' ? ('PASS' as StepStatus) : (stepStatuses[s.stepNumber] || 'PENDING'),
      }));

      const calculatedStatus = computeResultStatus(stepResultsArray.map(s => s.status));
      const finalStatus = overrideStatus || calculatedStatus;
      if (!finalStatus) {
        setSaveError('Mark every step as PASS, FAIL or BLOCKED before saving. Unmarked steps are not counted as passed.');
        setIsSaving(false);
        return;
      }
      setSaveError(null);

      await onUpdateRunResult(activeTestCase.id, {
        status: finalStatus,
        stepResults: stepResultsArray,
        actualResult,
        errorMessage,
        notes: executionNotes,
        evidenceList,
      });

      if (activeTestCaseIndex < testCases.length - 1) {
        switchTestCase(activeTestCaseIndex + 1);
      }
    } catch (err) {
      console.error('Failed to save test execution result:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeTestCase) {
    return (
      <div className="p-8 text-center text-neutral-300">
        No test cases assigned to this test run.
      </div>
    );
  }

  const hasAnyFailedStep = Object.values(stepStatuses).some(s => s === 'FAIL');

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md border border-white/[0.08] hover:border-white/[0.18] text-neutral-300 hover:text-white bg-white/[0.02] transition-colors"
            title="Back to Test Runs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-white">{testRun.runId}</span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-xs text-neutral-300 font-mono">{testRun.environment}</span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-xs font-mono text-accent-400 font-medium">{testRun.status}</span>
            </div>
            <h1 className="text-base font-semibold text-white mt-0.5">{testRun.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-300 font-mono text-xs">
            {activeTestCaseIndex + 1} of {testCases.length} suites
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={activeTestCaseIndex === 0}
              onClick={() => switchTestCase(activeTestCaseIndex - 1)}
              className="px-2.5 py-1 rounded-md border border-white/[0.08] hover:border-white/[0.16] disabled:opacity-30 disabled:cursor-not-allowed text-neutral-300 hover:text-white transition-colors"
            >
              Previous
            </button>
            <button
              disabled={activeTestCaseIndex === testCases.length - 1}
              onClick={() => switchTestCase(activeTestCaseIndex + 1)}
              className="px-2.5 py-1 rounded-md border border-white/[0.08] hover:border-white/[0.16] disabled:opacity-30 disabled:cursor-not-allowed text-neutral-300 hover:text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Main Execution Split View: Left Case Queue, Right Interactive Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Side: Test Case Queue */}
        <div className="craft-card rounded-lg p-3 space-y-2 lg:col-span-1 max-h-[75vh] overflow-y-auto">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 px-2 py-1 border-b border-white/[0.06] flex items-center justify-between">
            <span>Execution Queue</span>
            <span>{testCases.length}</span>
          </div>
          <div className="space-y-1 pt-1">
            {testCases.map((tc, idx) => {
              const res = testRun.results[tc.id];
              const isCurrent = idx === activeTestCaseIndex;
              const status = res?.status || 'Not Executed';

              return (
                <div
                  key={tc.id}
                  onClick={() => switchTestCase(idx)}
                  className={`p-2.5 rounded-md text-xs cursor-pointer transition-all ${
                    isCurrent
                      ? 'border border-white/[0.16] bg-[#1a1e28] text-white font-medium shadow-xs'
                      : 'border border-transparent hover:bg-white/[0.03] text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-neutral-300">{tc.code}</span>
                    <span className={`text-[11px] font-mono ${
                      status === 'Passed' ? 'text-emerald-400' :
                      status === 'Failed' ? 'text-rose-400' :
                      status === 'Blocked' ? 'text-amber-400' : 'text-neutral-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="line-clamp-1 text-white text-xs">{tc.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Execution & Failure Intake */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Test Case Header */}
          <div className="craft-card rounded-lg p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                  {activeTestCase.code}
                </span>
                <span className="text-neutral-400 text-xs">·</span>
                <span className={`text-xs font-medium ${
                  activeTestCase.priority === 'Critical' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {activeTestCase.priority}
                </span>
                <span className="text-neutral-400 text-xs">·</span>
                <span className="text-xs font-mono text-neutral-300">{activeTestCase.type}</span>
              </div>

              <div className="text-xs font-mono text-neutral-300">
                Status: <span className="text-white font-medium">{activeResult.status}</span>
              </div>
            </div>

            <h2 className="text-base font-semibold text-white pt-1">{activeTestCase.title}</h2>
            <p className="text-xs text-neutral-300 leading-relaxed">{activeTestCase.description}</p>

            {/* Expected Terminal Result */}
            <div className="mt-2 p-2.5 rounded-md bg-[#101217] border border-white/[0.06] text-xs">
              <span className="font-semibold text-neutral-300">Terminal Assertion: </span>
              <span className="text-neutral-300">{activeTestCase.expectedResult}</span>
            </div>
          </div>

          {/* Interactive Steps Execution List */}
          <div className="craft-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono">
                Step-by-Step Execution Verification
              </h3>
              <span className="text-xs text-neutral-300">Record verification outcome per step</span>
            </div>

            <div className="space-y-2.5">
              {activeTestCase.steps.map((step) => {
                const currentStepStatus = stepStatuses[step.stepNumber] || 'PENDING';
                return (
                  <div
                    key={step.stepNumber}
                    className={`p-3 rounded-md border transition-all ${
                      currentStepStatus === 'FAIL'
                        ? 'border-rose-500/30 bg-rose-500/[0.06]'
                        : currentStepStatus === 'BLOCKED'
                        ? 'border-amber-500/30 bg-amber-500/[0.06]'
                        : 'border-white/[0.06] bg-[#12151c]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-neutral-300">
                            Step {step.stepNumber}.
                          </span>
                          <span className="text-xs font-medium text-white">{step.action}</span>
                        </div>
                        {step.expected && (
                          <div className="text-xs text-neutral-300 pl-4 border-l border-white/[0.08]">
                            Expected: {step.expected}
                          </div>
                        )}
                      </div>

                      {/* Step Status Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStepStatusChange(step.stepNumber, 'PASS')}
                          className={`px-2.5 py-1 text-xs rounded-md border flex items-center gap-1 transition-all ${
                            currentStepStatus === 'PASS'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold shadow-xs'
                              : 'border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                          <span>PASS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStepStatusChange(step.stepNumber, 'FAIL')}
                          className={`px-2.5 py-1 text-xs rounded-md border flex items-center gap-1 transition-all ${
                            currentStepStatus === 'FAIL'
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold shadow-xs'
                              : 'border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <X className="h-3 w-3" />
                          <span>FAIL</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStepStatusChange(step.stepNumber, 'BLOCKED')}
                          className={`px-2.5 py-1 text-xs rounded-md border flex items-center gap-1 transition-all ${
                            currentStepStatus === 'BLOCKED'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold shadow-xs'
                              : 'border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <Ban className="h-3 w-3" />
                          <span>BLOCK</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failure & Evidence Section */}
          {hasAnyFailedStep && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <h3 className="text-xs font-semibold text-rose-300">Failure Diagnostics & Evidence Intake</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-200 hover:text-white border border-white/[0.1] hover:border-white/[0.2] bg-white/[0.03] rounded-md transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Attach Evidence Artifact</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label htmlFor="testexecutionrunner-f1" className="block text-neutral-300 mb-1 font-medium">Actual Result Observed</label>
                  <textarea id="testexecutionrunner-f1"
                    rows={3}
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    placeholder="e.g. Server returned HTTP 500 Internal Server Error when 4th concurrent device connected."
                    className="w-full px-3 py-2 bg-[#0e1015] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
                  />
                </div>
                <div>
                  <label htmlFor="testexecutionrunner-f2" className="block text-neutral-300 mb-1 font-medium">Error Message / Stack Trace</label>
                  <textarea id="testexecutionrunner-f2"
                    rows={3}
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    placeholder="e.g. RedisLeaseLockConflict: Key session:user_9921 lock held by process pid:4102."
                    className="w-full px-3 py-2 font-mono text-xs bg-[#0e1015] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
                  />
                </div>
              </div>

              {/* Evidence Artifacts List */}
              {evidenceList.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Attached Evidence ({evidenceList.length})
                  </div>
                  <div className="space-y-1.5">
                    {evidenceList.map((ev, i) => (
                      <div key={ev.id || i} className="p-2.5 rounded bg-[#101217] border border-white/[0.08] text-xs flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] uppercase text-neutral-300">[{ev.type}]</span>
                            <span className="font-semibold text-neutral-200">{ev.title}</span>
                          </div>
                          <div className="font-mono text-xs text-neutral-300 line-clamp-2">{ev.content}</div>
                        </div>
                        <button
                          onClick={() => setEvidenceList(evidenceList.filter((_, idx) => idx !== i))}
                          className="text-neutral-300 hover:text-rose-400 p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failure Analysis Trigger */}
              <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-neutral-300">
                  Ask AI to propose a root cause from the attached evidence
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const tempResult: TestResult = {
                      ...activeResult,
                      status: 'Failed',
                      actualResult,
                      errorMessage,
                      evidenceList,
                    };
                    onTriggerFailureAnalysis(activeTestCase, tempResult);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm"
                >
                  <BrainCircuit className="h-3.5 w-3.5 text-neutral-900" />
                  <span>Investigate Root Cause</span>
                </button>
              </div>
            </div>
          )}

          {saveError && (
            <div role="alert" className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              {saveError}
            </div>
          )}

          {/* Action Footer Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
            <div className="text-neutral-300 text-xs">
              Results are saved to the server when you press save
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveResult('Passed')}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-md border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Mark All Steps Passed & Advance
              </button>

              <button
                type="button"
                onClick={() => handleSaveResult()}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Save Execution Result</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attach Evidence Modal */}
      {showEvidenceModal && (
        <div role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-lg rounded-xl craft-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-xs font-semibold text-white">Attach Failure Evidence Artifact</h3>
              <button onClick={() => setShowEvidenceModal(false)} className="text-neutral-300 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">Evidence Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['console_log', 'network_log', 'error_message', 'notes'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEvidenceType(t)}
                      className={`px-2 py-1 text-xs rounded-md border capitalize text-center transition-all ${
                        evidenceType === t 
                          ? 'border-white/[0.2] bg-white/[0.1] text-white font-medium' 
                          : 'border-white/[0.06] text-neutral-300 hover:text-neutral-200'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="testexecutionrunner-f3" className="block text-neutral-300 mb-1 font-medium">Artifact Title</label>
                <input id="testexecutionrunner-f3"
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  placeholder="e.g. Browser Console Axios 500 trace"
                  className="w-full px-3 py-1.5 bg-[#0e1015] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
                />
              </div>

              <div>
                <label htmlFor="testexecutionrunner-f4" className="block text-neutral-300 mb-1 font-medium">Raw Payload / Output Content</label>
                <textarea id="testexecutionrunner-f4"
                  rows={6}
                  value={evidenceContent}
                  onChange={(e) => setEvidenceContent(e.target.value)}
                  placeholder="Paste raw console errors, HTTP request/response JSON, or stack trace..."
                  className="w-full px-3 py-2 font-mono text-xs bg-[#0e1015] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                className="px-3 py-1.5 text-neutral-300 hover:text-white border border-white/[0.08] rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEvidence}
                className="px-4 py-1.5 font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all"
              >
                Attach Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
