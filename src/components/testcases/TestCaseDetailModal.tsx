import React, { useState } from 'react';
import { 
  X, 
  Check, 
  XCircle, 
  Copy, 
  Trash2, 
  Edit3, 
  Save, 
  Loader2, 
  Plus, 
  AlertTriangle,
  BrainCircuit,
  CornerDownRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { TestCase, Priority, TestType, TestCaseStatus } from '../../types/qa';
import { api } from '../../services/api';
import { useEscapeKey } from '../../lib/useEscapeKey';

interface TestCaseDetailModalProps {
  testCase: TestCase | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCase: TestCase) => void;
  onDelete: (id: string) => void;
  onDuplicate: (testCase: TestCase) => void;
}

export const TestCaseDetailModal: React.FC<TestCaseDetailModalProps> = ({
  testCase,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  useEscapeKey(isOpen, onClose);
  if (!isOpen || !testCase) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improveInstruction, setImproveInstruction] = useState('');
  const [showImproveInput, setShowImproveInput] = useState(false);
  const [improvementExplanation, setImprovementExplanation] = useState<string | null>(null);

  // Edit Form State
  const [title, setTitle] = useState(testCase.title);
  const [description, setDescription] = useState(testCase.description);
  const [priority, setPriority] = useState<Priority>(testCase.priority);
  const [type, setType] = useState<TestType>(testCase.type);
  const [status, setStatus] = useState<TestCaseStatus>(testCase.status);
  const [expectedResult, setExpectedResult] = useState(testCase.expectedResult);
  const [risk, setRisk] = useState(testCase.risk);
  const [aiNotes, setAiNotes] = useState(testCase.aiNotes || '');

  const handleStatusChange = (newStatus: TestCaseStatus) => {
    const updated = { ...testCase, status: newStatus };
    onUpdate(updated);
  };

  const handleSaveEdits = () => {
    const updated: TestCase = {
      ...testCase,
      title,
      description,
      priority,
      type,
      status,
      expectedResult,
      risk,
      aiNotes,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleImproveWithAI = async (instructionText?: string) => {
    setIsImproving(true);
    setImprovementExplanation(null);
    try {
      const res = await api.improveTestCase(testCase, instructionText || 'Harden assertions and identify edge-case risks');
      if (res.testCase) {
        onUpdate(res.testCase);
        setImprovementExplanation(res.testCase.aiNotes || 'Test case updated with enhanced edge cases and failure checks.');
      }
    } catch (err: any) {
      console.error('Improve test failed:', err);
    } finally {
      setIsImproving(false);
      setShowImproveInput(false);
    }
  };

  const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
  const types: TestType[] = [
    'Functional', 'Regression', 'Security', 'Performance', 'Usability', 'Edge Case', 'Negative Test'
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="w-full max-w-3xl rounded-xl craft-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                {testCase.code}
              </span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className={`text-xs font-medium ${
                testCase.priority === 'Critical' ? 'text-rose-400' : testCase.priority === 'High' ? 'text-amber-400' : 'text-neutral-300'
              }`}>
                {testCase.priority} Priority
              </span>
              <span className="text-neutral-400 text-xs">·</span>
              <span className="text-xs text-neutral-300">{testCase.type}</span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-[#101217] border border-white/[0.12] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
              />
            ) : (
              <h2 className="text-base font-semibold text-white pt-1">{testCase.title}</h2>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.06] mb-5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange('Approved')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                testCase.status === 'Approved'
                  ? 'bg-accent-500/15 border-accent-500/30 text-accent-300 font-medium'
                  : 'border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Check className="h-3 w-3" />
              <span>Approve</span>
            </button>

            <button
              onClick={() => handleStatusChange('Rejected')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                testCase.status === 'Rejected'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 font-medium'
                  : 'border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <XCircle className="h-3 w-3" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Edit3 className="h-3 w-3" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
            </button>

            <button
              onClick={() => onDuplicate(testCase)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Copy className="h-3 w-3" />
              <span>Duplicate</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleImproveWithAI('Generate edge cases, race conditions, and boundary conditions')}
              disabled={isImproving}
              className="flex items-center gap-1.5 px-2.5 py-1 text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-all disabled:opacity-50"
            >
              {isImproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3 text-accent-400" />}
              <span>Generate Edge Cases</span>
            </button>

            <button
              onClick={() => setShowImproveInput(!showImproveInput)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-neutral-900 bg-neutral-100 hover:bg-white rounded-md transition-all font-medium"
            >
              <Sparkles className="h-3 w-3 text-neutral-900" />
              <span>Improve with AI</span>
            </button>
          </div>
        </div>

        {/* AI Improvement Input */}
        {showImproveInput && (
          <div className="mb-5 p-3.5 rounded-lg bg-[#141720] border border-white/[0.1] space-y-2">
            <label className="text-xs font-medium text-white flex items-center gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5 text-accent-400" />
              Specify AI Engineering Improvement Instructions
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={improveInstruction}
                onChange={(e) => setImproveInstruction(e.target.value)}
                placeholder="e.g. Add negative tests for expired auth token, or add latency boundary checks..."
                className="flex-1 px-3 py-1.5 text-xs bg-[#0b0c10] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
              />
              <button
                onClick={() => handleImproveWithAI(improveInstruction)}
                disabled={isImproving}
                className="px-3 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-colors"
              >
                {isImproving ? 'Reasoning...' : 'Refine'}
              </button>
            </div>
          </div>
        )}

        {/* Notice of AI explanation */}
        {improvementExplanation && (
          <div className="mb-5 p-3 rounded-md bg-accent-500/10 border border-accent-500/20 text-xs text-accent-300">
            <span className="font-semibold">AI Engineering Enhancement:</span> {improvementExplanation}
          </div>
        )}

        {/* Main Body */}
        {isEditing ? (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1 font-mono uppercase text-[11px]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#101217] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-300 mb-1 font-mono uppercase text-[11px]">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-2.5 py-1.5 bg-[#101217] border border-white/[0.1] rounded-md text-white"
                >
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono uppercase text-[11px]">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TestType)}
                  className="w-full px-2.5 py-1.5 bg-[#101217] border border-white/[0.1] rounded-md text-white"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-mono uppercase text-[11px]">Risk Level</label>
                <select
                  value={risk}
                  onChange={(e) => setRisk(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#101217] border border-white/[0.1] rounded-md text-white"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 mb-1 font-mono uppercase text-[11px]">Expected Result</label>
              <textarea
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#101217] border border-white/[0.1] rounded-md text-white focus:outline-none focus:border-white/[0.25]"
              />
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white border border-white/[0.08] rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdits}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-950 bg-neutral-100 hover:bg-white rounded-md"
              >
                <Save className="h-3 w-3" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Description */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1">Scope & Objective</h4>
              <p className="text-neutral-300 leading-relaxed bg-[#12151c] p-3 rounded-md border border-white/[0.05]">
                {testCase.description}
              </p>
            </div>

            {/* Preconditions */}
            {testCase.preconditions && testCase.preconditions.length > 0 && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">Preconditions</h4>
                <ul className="space-y-1.5 bg-[#12151c] p-3 rounded-md border border-white/[0.05]">
                  {testCase.preconditions.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-neutral-300">
                      <span className="text-neutral-400 font-mono text-[11px] mt-0.5">[{idx + 1}]</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Execution Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-300">
                  Execution Steps ({testCase.steps.length})
                </h4>
              </div>
              <div className="space-y-2">
                {testCase.steps.map((st) => (
                  <div 
                    key={st.stepNumber}
                    className="p-3 rounded-md bg-[#12151c] border border-white/[0.05] hover:border-white/[0.1] transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center h-5 w-5 rounded bg-white/[0.06] text-white font-mono text-xs shrink-0 font-medium border border-white/[0.06]">
                        {st.stepNumber}
                      </span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{st.action}</div>
                        {st.expected && (
                          <div className="flex items-start gap-1.5 text-xs text-accent-400/90 mt-1">
                            <CornerDownRight className="h-3 w-3 shrink-0 mt-0.5 text-accent-400/70" />
                            <span>Expected: {st.expected}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Result */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1">Terminal Assertion</h4>
              <div className="p-3 rounded-md bg-[#12151c] border border-white/[0.05] text-neutral-200">
                {testCase.expectedResult}
              </div>
            </div>

            {/* AI Engineering Notes */}
            {testCase.aiNotes && (
              <div className="p-3.5 rounded-md bg-[#141722] border border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-accent-400 font-mono text-xs mb-1">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Quality Engineering Analysis</span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  {testCase.aiNotes}
                </p>
              </div>
            )}

            {/* Tags & Delete */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                {testCase.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="text-xs font-mono text-neutral-300 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onDelete(testCase.id)}
                className="flex items-center gap-1 text-xs text-rose-400/80 hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Test</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
