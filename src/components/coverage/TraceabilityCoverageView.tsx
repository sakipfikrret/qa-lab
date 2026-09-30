import React, { useState } from 'react';
import { 
  GitFork, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Loader2, 
  Search, 
  ShieldAlert, 
  ArrowRight,
  BrainCircuit,
  Plus,
  Layers
} from 'lucide-react';
import { Requirement, TestCase, TestRun, Bug, Project, RequirementRisk } from '../../types/qa';
import { api } from '../../services/api';

interface TraceabilityCoverageViewProps {
  project: Project;
  requirements: Requirement[];
  testCases: TestCase[];
  testRuns: TestRun[];
  bugs: Bug[];
  onNavigateToDesigner: () => void;
}

export const TraceabilityCoverageView: React.FC<TraceabilityCoverageViewProps> = ({
  project,
  requirements,
  testCases,
  testRuns,
  bugs,
  onNavigateToDesigner,
}) => {
  const [activeTab, setActiveTab] = useState<'traceability' | 'risks'>('traceability');
  const [selectedReqId, setSelectedReqId] = useState<string>(requirements[0]?.id || '');
  const [isScanningRisks, setIsScanningRisks] = useState(false);
  const [scannedRisks, setScannedRisks] = useState<RequirementRisk[]>([]);
  const [riskScanNotice, setRiskScanNotice] = useState<string | null>(null);

  // Compute coverage statistics
  const requirementsWithTests = requirements.map(req => {
    const cases = testCases.filter(tc => tc.requirementId === req.id);
    return {
      ...req,
      cases,
      isCovered: cases.length > 0,
    };
  });

  const coveredCount = requirementsWithTests.filter(r => r.isCovered).length;
  const totalCount = requirements.length;
  const coverageRate = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;
  const uncoveredCount = totalCount - coveredCount;

  // Selected requirement trace pipeline
  const currentReq = requirementsWithTests.find(r => r.id === selectedReqId) || requirementsWithTests[0];
  const currentCases = currentReq ? testCases.filter(tc => tc.requirementId === currentReq.id) : [];

  const handleScanRisks = async () => {
    setIsScanningRisks(true);
    setRiskScanNotice(null);
    try {
      const textToScan = requirements.map(r => `[${r.code}] ${r.title}\n${r.content}`).join('\n\n');
      const res = await api.scanRequirementRisks({
        requirementsText: textToScan,
        projectId: project.id,
      });

      if (res.risks) {
        setScannedRisks(res.risks);
        setRiskScanNotice(res.isRealAI ? 'Risk audit completed via Gemini' : 'Simulated heuristic risk analysis');
      }
    } catch (err: any) {
      console.error('Risk scan failed:', err);
      setRiskScanNotice(`Scan note: ${err.message}`);
    } finally {
      setIsScanningRisks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Traceability & Risk Scanner</h1>
            <span className="font-mono text-xs text-neutral-300">Coverage Matrix</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Audit test coverage depth, bidirectional requirement-to-defect lineage, and architectural ambiguity
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#101217] border border-white/[0.08] rounded-md">
          <button
            onClick={() => setActiveTab('traceability')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'traceability' 
                ? 'bg-white/[0.12] text-white shadow-xs' 
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Traceability Matrix
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'risks' 
                ? 'bg-white/[0.12] text-white shadow-xs' 
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            Specification Risk Audit
          </button>
        </div>
      </div>

      {activeTab === 'traceability' ? (
        <div className="space-y-6">
          {/* Coverage Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg craft-card">
              <span className="text-neutral-300 text-xs font-medium">Coverage Rate</span>
              <div className="text-2xl font-mono font-bold text-white mt-1">{coverageRate}%</div>
              <div className="text-xs text-neutral-300 mt-1">{coveredCount} of {totalCount} specifications mapped</div>
            </div>

            <div className="p-4 rounded-lg craft-card">
              <span className="text-neutral-300 text-xs font-medium">Covered Specifications</span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">{coveredCount}</div>
              <div className="text-xs text-neutral-300 mt-1">Grounded by active test cases</div>
            </div>

            <div className="p-4 rounded-lg craft-card">
              <span className="text-neutral-300 text-xs font-medium">Uncovered Gaps</span>
              <div className={`text-2xl font-mono font-bold mt-1 ${uncoveredCount > 0 ? 'text-amber-400' : 'text-neutral-200'}`}>
                {uncoveredCount}
              </div>
              <div className="text-xs text-neutral-300 mt-1">Awaiting test authoring</div>
            </div>

            <div className="p-4 rounded-lg craft-card flex flex-col justify-between">
              <span className="text-neutral-300 text-xs font-medium">Remediation</span>
              <button
                onClick={onNavigateToDesigner}
                className="mt-2 w-full py-1.5 px-3 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all text-center"
              >
                + Author Missing Tests
              </button>
            </div>
          </div>

          {/* Trace Pipeline: 4 Column Visual Lineage */}
          <div className="craft-card rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white">Bidirectional Quality Lineage</h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Select a requirement on the left to inspect its test coverage, execution runs, and linked defects
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Col 1: Requirements Selection (4 cols) */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 pb-1">
                  1. Requirements ({requirements.length})
                </div>
                <div className="space-y-1.5">
                  {requirementsWithTests.map((r) => {
                    const isSelected = r.id === (currentReq?.id || selectedReqId);
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReqId(r.id)}
                        className={`p-3 rounded-md text-xs cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#181c26] border border-white/[0.14] text-white shadow-xs' 
                            : 'bg-[#101217] border border-white/[0.05] hover:border-white/[0.1] text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-semibold text-white">{r.code}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.isCovered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        </div>
                        <div className="font-medium text-neutral-100 line-clamp-1">{r.title}</div>
                        <div className="text-xs text-neutral-300 mt-1 line-clamp-1">{r.content}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Col 2: Test Cases Mapped (4 cols) */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 pb-1">
                  2. Mapped Test Cases ({currentCases.length})
                </div>
                {currentCases.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-300 border border-dashed border-white/[0.08] rounded-md">
                    No test cases assigned to this specification.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentCases.map((tc) => (
                      <div key={tc.id} className="p-3 rounded-md bg-[#12151c] border border-white/[0.06] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-accent-400">{tc.code}</span>
                          <span className="text-[11px] text-neutral-300 font-mono">{tc.type}</span>
                        </div>
                        <div className="font-medium text-white">{tc.title}</div>
                        <div className="text-xs text-neutral-300 line-clamp-2">{tc.expectedResult}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Col 3: Telemetry & Defects (4 cols) */}
              <div className="md:col-span-4 space-y-2 max-h-[500px] overflow-y-auto">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 pb-1">
                  3. Execution & Open Defects
                </div>
                <div className="space-y-2">
                  {currentCases.map((tc) => {
                    const linkedBugs = bugs.filter(b => b.testCaseId === tc.id);
                    return (
                      <div key={tc.id} className="p-3 rounded-md bg-[#12151c] border border-white/[0.06] text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-neutral-300">{tc.code} Status</span>
                          <span className="text-[11px] font-mono text-neutral-300">{tc.status}</span>
                        </div>

                        {linkedBugs.length > 0 ? (
                          <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                            <span className="text-[11px] text-rose-400 uppercase font-mono block">
                              Active Linked Defect:
                            </span>
                            {linkedBugs.map(b => (
                              <div key={b.id} className="p-2 rounded bg-rose-500/[0.06] border border-rose-500/20 text-xs">
                                <span className="font-mono font-semibold text-rose-300">{b.bugId}: </span>
                                <span className="text-neutral-200">{b.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-accent-400/90 flex items-center gap-1.5 pt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>No open defects recorded</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Risk Scanner Tab */
        <div className="space-y-4">
          <div className="craft-card rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white">AI Requirement Risk Scanner</h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Audits requirements for specification ambiguity, missing acceptance criteria, and security edge cases
                </p>
              </div>

              <button
                onClick={handleScanRisks}
                disabled={isScanningRisks}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all disabled:opacity-50"
              >
                {isScanningRisks ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-900" />
                    <span>Scanning Specifications...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-3.5 w-3.5 text-neutral-900" />
                    <span>Trigger Specification Risk Scan</span>
                  </>
                )}
              </button>
            </div>

            {riskScanNotice && (
              <div className="p-2.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-neutral-300 font-mono">
                {riskScanNotice}
              </div>
            )}

            {scannedRisks.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-300 space-y-2">
                <ShieldAlert className="h-6 w-6 text-neutral-400 mx-auto" />
                <p>Click "Trigger Specification Risk Scan" to run Gemini requirements quality analysis.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scannedRisks.map((riskItem) => (
                  <div key={riskItem.id} className="p-4 rounded-md bg-[#12151c] border border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-neutral-300 text-xs">Specification Risk</span>
                      <span className={`text-xs font-medium ${
                        riskItem.severity === 'Critical' ? 'text-rose-400' : riskItem.severity === 'High' ? 'text-amber-400' : 'text-neutral-300'
                      }`}>
                        {riskItem.severity} Severity
                      </span>
                    </div>

                    <h4 className="font-semibold text-white">{riskItem.risk}</h4>
                    {riskItem.evidence && (
                      <p className="text-neutral-300 leading-relaxed font-mono text-xs bg-[#0c0d12] p-2 rounded border border-white/[0.04]">
                        {riskItem.evidence}
                      </p>
                    )}

                    <div className="pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] uppercase font-mono text-accent-400 block mb-0.5">
                        Remediation Recommendation:
                      </span>
                      <p className="text-neutral-300">{riskItem.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
