import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Bug as BugIcon, 
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  BrainCircuit,
  SearchCheck,
  ShieldAlert
} from 'lucide-react';
import { TestCase, TestResult, AIFailureAnalysis, TestRun, Bug } from '../../types/qa';
import { api } from '../../services/api';

interface FailureAnalysisViewProps {
  testCases: TestCase[];
  testRuns: TestRun[];
  initialTestCase?: TestCase | null;
  initialResult?: TestResult | null;
  onCreateBugFromAnalysis: (data: { testCase: TestCase; testResult: TestResult; analysis: AIFailureAnalysis }) => Promise<void>;
  onNavigateToBugs: () => void;
}

export const FailureAnalysisView: React.FC<FailureAnalysisViewProps> = ({
  testCases,
  testRuns,
  initialTestCase,
  initialResult,
  onCreateBugFromAnalysis,
  onNavigateToBugs,
}) => {
  const failedItems: Array<{ testCase: TestCase; result: TestResult; run: TestRun }> = [];
  testRuns.forEach(run => {
    Object.values(run.results).forEach(res => {
      if (res.status === 'Failed') {
        const tc = testCases.find(t => t.id === res.testCaseId);
        if (tc) {
          failedItems.push({ testCase: tc, result: res, run });
        }
      }
    });
  });

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const currentItem = failedItems[selectedItemIndex] || (initialTestCase && initialResult ? { testCase: initialTestCase, result: initialResult, run: testRuns[0] } : null);

  const [analysis, setAnalysis] = useState<AIFailureAnalysis | null>(currentItem?.result.aiAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingBug, setIsGeneratingBug] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!currentItem) return;
    setIsAnalyzing(true);
    setStatusMessage(null);
    try {
      const res = await api.analyzeFailure({
        testCase: currentItem.testCase,
        actualResult: currentItem.result.actualResult || 'Assertion failure during test run',
        errorMessage: currentItem.result.errorMessage,
        evidenceList: currentItem.result.evidenceList,
        previousContext: `Execution on ${currentItem.run?.environment || 'Staging'} environment.`,
      });

      if (res.analysis) {
        setAnalysis(res.analysis);
        currentItem.result.aiAnalysis = res.analysis;
        if (res.isRealAI) {
          setStatusMessage('Forensic triage completed via Gemini.');
        } else {
          setStatusMessage('Forensic triage generated via deterministic QA baseline engine.');
        }
      }
    } catch (err: any) {
      console.error('Failure analysis failed:', err);
      setStatusMessage(`Analysis note: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateBug = async () => {
    if (!currentItem || !analysis) return;
    setIsGeneratingBug(true);
    try {
      await onCreateBugFromAnalysis({
        testCase: currentItem.testCase,
        testResult: currentItem.result,
        analysis,
      });
      setStatusMessage('Formal Bug Report generated and committed to defect tracker.');
    } catch (err) {
      console.error('Failed to create bug report:', err);
    } finally {
      setIsGeneratingBug(false);
    }
  };

  if (!currentItem) {
    return (
      <div className="p-16 text-center craft-card rounded-lg space-y-3 max-w-xl mx-auto my-8">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
        <h2 className="text-base font-semibold text-white">All Test Runs Passing</h2>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Zero unmitigated execution failures in active project suite. To simulate a triage session, mark any step in Test Execution Runner as FAIL.
        </p>
      </div>
    );
  }

  const { testCase, result, run } = currentItem;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Failure Triage</h1>
            <span className="font-mono text-xs text-neutral-300">Incident analysis</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Correlate runtime assertions, server exceptions, and evidence artifacts to isolate root cause
          </p>
        </div>

        {failedItems.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-300 font-mono text-xs">Active Incidents ({failedItems.length}):</span>
            <select
              value={selectedItemIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedItemIndex(idx);
                setAnalysis(failedItems[idx]?.result.aiAnalysis || null);
              }}
              className="px-2.5 py-1 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white font-mono"
            >
              {failedItems.map((item, idx) => (
                <option key={idx} value={idx}>
                  {item.testCase.code} ({item.run.runId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Two Column Layout: Left Incident Evidence Facts, Right AI Root Cause Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Failure Facts & Provided Evidence */}
        <div className="space-y-4">
          <div className="craft-card rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.06]">
              <span className="font-semibold uppercase tracking-wider text-neutral-300 font-mono text-xs">
                Incident Context
              </span>
              <span className="font-mono text-neutral-300">{run?.runId} · {run?.environment}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                  {testCase.code}
                </span>
                <span className="text-neutral-400 text-xs">·</span>
                <span className="text-xs text-rose-400 font-medium">{testCase.priority} Priority</span>
              </div>
              <h2 className="text-sm font-semibold text-white pt-0.5">{testCase.title}</h2>
            </div>

            {/* Expected vs Actual */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
                <span className="font-semibold text-neutral-300 block mb-0.5">Expected Specification:</span>
                <p className="text-neutral-300 leading-relaxed">{testCase.expectedResult}</p>
              </div>

              <div className="p-3 rounded-md bg-rose-500/[0.06] border border-rose-500/20">
                <span className="font-semibold text-rose-300 block mb-0.5">Observed Runtime Outcome:</span>
                <p className="text-neutral-200 leading-relaxed">{result.actualResult || 'Assertion failure'}</p>
              </div>
            </div>

            {/* Error Message */}
            {result.errorMessage && (
              <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06] text-xs space-y-1">
                <span className="font-semibold text-neutral-300 block text-xs font-mono uppercase">
                  Runtime Exception Trace:
                </span>
                <pre className="font-mono text-xs text-rose-300/90 whitespace-pre-wrap overflow-x-auto leading-relaxed bg-[#0b0c0f] p-2.5 rounded border border-white/[0.04]">
                  {result.errorMessage}
                </pre>
              </div>
            )}
          </div>

          {/* Evidence Artifacts Drawer */}
          <div className="craft-card rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.06]">
              <span className="font-semibold uppercase tracking-wider text-neutral-300 font-mono text-xs">
                Corroborating Evidence Artifacts ({result.evidenceList?.length || 0})
              </span>
              <span className="text-xs text-neutral-400">Strictly verified</span>
            </div>

            {(!result.evidenceList || result.evidenceList.length === 0) ? (
              <div className="p-6 text-center text-xs text-neutral-300">
                No logs or telemetry payloads attached to this incident.
              </div>
            ) : (
              <div className="space-y-2">
                {result.evidenceList.map((ev, i) => (
                  <div key={ev.id || i} className="p-3 rounded-md bg-[#101217] border border-white/[0.06] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-200">{ev.title}</span>
                      <span className="font-mono text-[11px] uppercase text-neutral-300">[{ev.type}]</span>
                    </div>
                    <pre className="font-mono text-xs text-neutral-300 whitespace-pre-wrap overflow-x-auto max-h-40 leading-relaxed bg-[#090a0d] p-2 rounded border border-white/[0.04]">
                      {ev.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Gemini Forensic Analysis */}
        <div className="space-y-4">
          <div className="craft-card rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent-400" />
                <h2 className="text-sm font-semibold text-white">AI Triage Report</h2>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-900" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <SearchCheck className="h-3.5 w-3.5 text-neutral-900" />
                    <span>{analysis ? 'Re-Triage Incident' : 'Analyze Failure'}</span>
                  </>
                )}
              </button>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-neutral-300 font-mono">
                {statusMessage}
              </div>
            )}

            {!analysis ? (
              <div className="py-16 text-center text-xs text-neutral-300 space-y-2">
                <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
                <p>Click "Analyze Failure" to isolate root cause across the stack trace and expected state.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Confidence Level Badge */}
                <div className="flex items-center justify-between p-3 rounded-md bg-[#101217] border border-white/[0.06]">
                  <span className="text-neutral-300 font-medium">Diagnostic Confidence:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-semibold ${
                      analysis.confidence === 'High' ? 'text-emerald-400' :
                      analysis.confidence === 'Medium' ? 'text-amber-400' : 'text-neutral-300'
                    }`}>
                      {analysis.confidence} Confidence
                    </span>
                    <span className="text-[11px] text-neutral-400">(from attached evidence)</span>
                  </div>
                </div>

                {/* Failure Summary */}
                <div>
                  <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
                    Failure Summary
                  </span>
                  <p className="p-3 rounded-md bg-[#101217] border border-white/[0.06] text-neutral-200 leading-relaxed">
                    {analysis.failureSummary}
                  </p>
                </div>

                {/* Probable Root Cause */}
                <div>
                  <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
                    Probable Root Cause
                  </span>
                  <p className="p-3 rounded-md bg-[#101217] border border-white/[0.06] text-neutral-300 leading-relaxed">
                    {analysis.probableCause}
                  </p>
                </div>

                {/* Grounded Evidence Citations */}
                <div>
                  <span className="font-semibold text-neutral-300 block mb-1.5 font-mono uppercase text-[11px]">
                    Corroborating Evidence Citations
                  </span>
                  <ul className="space-y-1.5">
                    {analysis.evidenceSupported.map((cite, idx) => (
                      <li key={idx} className="p-2.5 rounded-md bg-[#101217] border border-white/[0.06] text-neutral-300 flex items-start gap-2">
                        <span className="font-mono text-[11px] text-accent-400 mt-0.5">#{idx + 1}</span>
                        <span className="leading-relaxed">{cite}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Investigation Steps */}
                <div>
                  <span className="font-semibold text-neutral-300 block mb-1.5 font-mono uppercase text-[11px]">
                    Debugging Directives
                  </span>
                  <div className="rounded-md border border-white/[0.06] overflow-hidden bg-[#101217] divide-y divide-white/[0.04]">
                    {analysis.suggestedInvestigation.map((step, idx) => (
                      <div key={idx} className="p-2.5 flex items-start gap-2 text-neutral-300">
                        <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regression Risk & Fix Direction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
                    <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
                      Regression Risk
                    </span>
                    <p className="text-neutral-300 leading-relaxed">{analysis.regressionRisk}</p>
                  </div>
                  <div className="p-3 rounded-md bg-[#101217] border border-white/[0.06]">
                    <span className="font-semibold text-neutral-300 block mb-1 font-mono uppercase text-[11px]">
                      Fix Direction
                    </span>
                    <p className="text-neutral-300 leading-relaxed">{analysis.recommendedFixDirection}</p>
                  </div>
                </div>

                {/* Create Bug Report CTA */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-neutral-300">
                    Convert forensic diagnosis into an engineering defect ticket
                  </span>

                  <button
                    onClick={handleCreateBug}
                    disabled={isGeneratingBug}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm disabled:opacity-50"
                  >
                    {isGeneratingBug ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-900" />
                        <span>Filing Defect...</span>
                      </>
                    ) : (
                      <>
                        <BugIcon className="h-3.5 w-3.5 text-neutral-900" />
                        <span>File Defect Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
