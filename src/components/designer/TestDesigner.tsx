import React, { useState } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ShieldAlert, 
  Code, 
  Layers,
  ArrowRight,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Terminal,
  Sliders,
  FileCheck2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Project, Requirement, TestCase, Priority, TestType, QAInsight } from '../../types/qa';
import { api } from '../../services/api';

interface TestDesignerProps {
  project: Project;
  requirements: Requirement[];
  onTestCasesGenerated: (newCases: TestCase[]) => void;
  onNavigateToCases: () => void;
}

export const TestDesigner: React.FC<TestDesignerProps> = ({
  project,
  requirements,
  onTestCasesGenerated,
  onNavigateToCases,
}) => {
  const [selectedReqId, setSelectedReqId] = useState<string>(requirements[0]?.id || 'custom');
  const [customRequirement, setCustomRequirement] = useState(
    'Users can reset their password via time-bound token. After password reset, previous sessions must be revoked and the user redirected to /login with an audit log entry.'
  );
  const [testFocus, setTestFocus] = useState<string>('Comprehensive (Functional, Edge Cases, Security, Negative)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCases, setGeneratedCases] = useState<TestCase[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Record<string, boolean>>({});
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const selectedRequirementObj = requirements.find(r => r.id === selectedReqId);

  // Specification presets for quick testing
  const presets = [
    {
      title: 'OAuth PKCE & Session Invalidation',
      text: 'Users authenticate via OAuth 2.0 PKCE flow. Expired refresh tokens must cleanly fail with HTTP 401 without infinite redirect loops. Concurrent logins must be logged.',
    },
    {
      title: 'Payment Webhook Idempotency',
      text: 'Payment webhook handler receives Stripe checkout events. Duplicate event IDs must be acknowledged with HTTP 200 without executing duplicate fulfillment transactions.',
    },
    {
      title: 'Role-Based Authorization Escapes',
      text: 'Tenant users have Member or Admin roles. Member tokens accessing Admin routes must be rejected with HTTP 403 and rate-limited upon repeated attempts.',
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationNotice(null);
    try {
      const requirementText = selectedReqId === 'custom' || !selectedRequirementObj 
        ? customRequirement 
        : `${selectedRequirementObj.title}: ${selectedRequirementObj.content}`;

      const res = await api.generateTestCases({
        projectId: project.id,
        requirementId: selectedReqId !== 'custom' ? selectedReqId : undefined,
        requirementText,
        projectContext: `${project.name} (${project.type}). Tech: ${project.techStack.join(', ')}`,
        testFocus,
      });

      if (res.testCases && res.testCases.length > 0) {
        setGeneratedCases(res.testCases);
        const selMap: Record<string, boolean> = {};
        res.testCases.forEach(tc => { selMap[tc.id] = true; });
        setSelectedCaseIds(selMap);
        setExpandedCaseId(res.testCases[0].id);

        if (res.isRealAI) {
          setGenerationNotice('Generated live with Gemini.');
        } else {
          setGenerationNotice('Generated using deterministic QA heuristic engine.');
        }
      }
    } catch (err: any) {
      console.error('Test generation failed:', err);
      setGenerationNotice(`Generation notice: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedCaseIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveSelected = () => {
    const toSave = generatedCases.filter(c => selectedCaseIds[c.id]);
    if (toSave.length > 0) {
      onTestCasesGenerated(toSave);
      onNavigateToCases();
    }
  };

  const selectedCount = Object.values(selectedCaseIds).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">AI Test Designer Studio</h1>
            <span className="font-mono text-xs text-neutral-300">Target: {project.name}</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Transform natural-language requirements and user stories into rigorous, structured test scenarios with edge cases
          </p>
        </div>

        <button
          onClick={onNavigateToCases}
          className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Test Cases</span>
        </button>
      </div>

      {/* Main Studio Grid: Input Formulation on Left, Review on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Specification (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="craft-card rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                1. Specification Source
              </label>
              <select
                value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2]"
              >
                <option value="custom">Custom Requirement / User Story</option>
                {requirements.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.code}: {req.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Requirement Text Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  2. Acceptance Criteria & Behavior
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {selectedReqId === 'custom' ? `${customRequirement.length} chars` : 'Linked spec'}
                </span>
              </div>

              {selectedReqId === 'custom' ? (
                <textarea
                  value={customRequirement}
                  onChange={(e) => setCustomRequirement(e.target.value)}
                  rows={5}
                  placeholder="Describe expected user flow, permissions, state changes, or API contracts..."
                  className="w-full p-3 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] leading-relaxed resize-y font-mono"
                />
              ) : (
                <div className="p-3 bg-[#101217] rounded-md border border-white/[0.08] text-xs text-neutral-300 space-y-1">
                  <div className="font-semibold text-white">{selectedRequirementObj?.title}</div>
                  <div className="text-neutral-300 font-mono text-xs leading-relaxed">
                    {selectedRequirementObj?.content}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            {selectedReqId === 'custom' && (
              <div>
                <span className="text-xs text-neutral-300 font-medium block mb-1.5">
                  Or load standard specification preset:
                </span>
                <div className="flex flex-col gap-1.5">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustomRequirement(preset.text)}
                      className="text-left p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all text-xs"
                    >
                      <div className="font-medium text-neutral-200">{preset.title}</div>
                      <div className="text-[11px] text-neutral-300 truncate mt-0.5">{preset.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Test Focus Scope */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                3. Test Generation Focus
              </label>
              <select
                value={testFocus}
                onChange={(e) => setTestFocus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2]"
              >
                <option value="Comprehensive (Functional, Edge Cases, Security, Negative)">
                  Comprehensive (Functional, Edge Cases, Security, Negative)
                </option>
                <option value="Edge Cases & Boundary Conditions Only">
                  Edge Cases & Boundary Conditions Only
                </option>
                <option value="Security, Auth & Negative Vulnerability Tests">
                  Security, Auth & Negative Vulnerability Tests
                </option>
                <option value="Performance & High Concurrency">
                  Performance & Concurrency Checks
                </option>
              </select>
            </div>

            {/* Generate Trigger Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-900" />
                    <span>Analyzing requirement & synthesizing tests...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4 text-neutral-900" />
                    <span>Synthesize Test Cases</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Test Suite Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="craft-card rounded-lg p-4 flex flex-col h-full min-h-[500px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Synthesized Test Cases</h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  {generatedCases.length > 0 
                    ? `${selectedCount} of ${generatedCases.length} selected for commit` 
                    : 'Submit requirement to generate structured test cases'}
                </p>
              </div>

              {generatedCases.length > 0 && (
                <button
                  onClick={handleSaveSelected}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all disabled:opacity-40"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Commit {selectedCount} to Repository</span>
                </button>
              )}
            </div>

            {/* Notice */}
            {generationNotice && (
              <div className="mb-3 px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-neutral-300 font-mono">
                {generationNotice}
              </div>
            )}

            {/* Case List or Empty State */}
            {generatedCases.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-neutral-300 px-4">
                <div className="h-10 w-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                  <FileCheck2 className="h-5 w-5 text-neutral-400" />
                </div>
                <h4 className="text-sm font-medium text-neutral-200 mb-1">Awaiting Requirement Input</h4>
                <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
                  Provide a natural-language user story or select a project requirement on the left, then click Synthesize.
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {generatedCases.map((tc) => {
                  const isSelected = selectedCaseIds[tc.id];
                  const isExpanded = expandedCaseId === tc.id;
                  return (
                    <div 
                      key={tc.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-white/[0.14] bg-[#141722]/90' 
                          : 'border-white/[0.06] bg-[#0e1015]/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={Boolean(isSelected)}
                            onChange={() => handleToggleSelect(tc.id)}
                            className="mt-1 h-3.5 w-3.5 rounded border-neutral-700 bg-neutral-900 text-accent-500 focus:ring-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-white">{tc.code}</span>
                              <span className="text-neutral-400 text-xs">·</span>
                              <span className={`text-xs font-medium ${
                                tc.priority === 'Critical' ? 'text-rose-400' : tc.priority === 'High' ? 'text-amber-400' : 'text-neutral-300'
                              }`}>
                                {tc.priority}
                              </span>
                              <span className="text-neutral-400 text-xs">·</span>
                              <span className="text-xs font-mono text-neutral-300">{tc.type}</span>
                            </div>
                            <div className="text-xs font-semibold text-neutral-100 mt-1">{tc.title}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedCaseId(isExpanded ? null : tc.id)}
                          className="text-neutral-300 hover:text-white p-1 rounded transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3 text-xs">
                          <div>
                            <div className="text-[11px] font-mono uppercase text-neutral-300 mb-1">Preconditions</div>
                            <ul className="list-disc pl-4 text-neutral-300 space-y-0.5">
                              {tc.preconditions.map((p, idx) => (
                                <li key={idx}>{p}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <div className="text-[11px] font-mono uppercase text-neutral-300 mb-1">Steps</div>
                            <div className="space-y-1">
                              {tc.steps.map((st) => (
                                <div key={st.stepNumber} className="flex gap-2 text-neutral-300">
                                  <span className="font-mono text-neutral-300 shrink-0">{st.stepNumber}.</span>
                                  <span>{st.action}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-mono uppercase text-neutral-300 mb-1">Expected Result</div>
                            <div className="text-accent-400 font-medium">{tc.expectedResult}</div>
                          </div>

                          {tc.aiNotes && (
                            <div className="p-2.5 rounded bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-300">
                              <span className="font-semibold text-accent-400">Engineering Rationale: </span>
                              {tc.aiNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
