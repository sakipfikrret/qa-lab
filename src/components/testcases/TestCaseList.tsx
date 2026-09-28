import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  XCircle, 
  Copy, 
  Trash2, 
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { TestCase, Project, Requirement, Priority, TestType, TestCaseStatus } from '../../types/qa';
import { TestCaseDetailModal } from './TestCaseDetailModal';

interface TestCaseListProps {
  project: Project;
  testCases: TestCase[];
  requirements: Requirement[];
  onOpenDesigner: () => void;
  onUpdateTestCase: (updatedCase: TestCase) => void;
  onDeleteTestCase: (id: string) => void;
  onDuplicateTestCase: (testCase: TestCase) => void;
}

export const TestCaseList: React.FC<TestCaseListProps> = ({
  project,
  testCases,
  requirements,
  onOpenDesigner,
  onUpdateTestCase,
  onDeleteTestCase,
  onDuplicateTestCase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);

  const filteredCases = testCases.filter((tc) => {
    const matchesSearch = 
      tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || tc.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;

    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const testTypes: TestType[] = [
    'Functional', 'Regression', 'Security', 'Performance', 'Usability', 'Edge Case', 'Negative Test'
  ];
  const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
  const statuses: TestCaseStatus[] = ['Approved', 'Draft', 'Needs Review', 'Rejected'];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Test Specifications Repository</h1>
            <span className="font-mono text-xs text-neutral-300">
              ({testCases.length} total)
            </span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Structured test cases, acceptance criteria, preconditions, and risk classifications for {project.name}
          </p>
        </div>

        <button
          onClick={onOpenDesigner}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-900 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-900" />
          <span>Design Test Cases with AI</span>
        </button>
      </div>

      {/* Filter and Search Bar (Crafted Toolbar) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-lg craft-card">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by code, title, or tag..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-400 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-neutral-300 focus:outline-none focus:border-white/[0.2] transition-colors"
          >
            <option value="all">All Types</option>
            {testTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-neutral-300 focus:outline-none focus:border-white/[0.2] transition-colors"
          >
            <option value="all">All Priorities</option>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-neutral-300 focus:outline-none focus:border-white/[0.2] transition-colors"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="text-xs text-neutral-300 font-mono text-right shrink-0">
          Showing {filteredCases.length} of {testCases.length}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="rounded-lg craft-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#12151c] border-b border-white/[0.07] text-xs uppercase tracking-wider text-neutral-300 font-mono">
            <tr>
              <th className="py-2.5 px-4 w-32">Identifier</th>
              <th className="py-2.5 px-4">Title & Scope</th>
              <th className="py-2.5 px-4 w-24">Priority</th>
              <th className="py-2.5 px-4 w-28">Type</th>
              <th className="py-2.5 px-4 w-20">Steps</th>
              <th className="py-2.5 px-4 w-28">Status</th>
              <th className="py-2.5 px-4 w-16 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-300 text-xs">
                  No test specifications match current criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((tc) => {
                const req = requirements.find(r => r.id === tc.requirementId);
                return (
                  <tr
                    key={tc.id}
                    onClick={() => setSelectedCase(tc)}
                    className="hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-white group-hover:text-accent-300 transition-colors">
                      {tc.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-100 group-hover:text-white transition-colors">
                        {tc.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
                        {req && <span className="font-mono text-neutral-300">{req.code}</span>}
                        {req && <span>·</span>}
                        <span className="line-clamp-1 text-neutral-300">{tc.description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${
                        tc.priority === 'Critical' 
                          ? 'text-rose-400' 
                          : tc.priority === 'High' 
                          ? 'text-amber-400' 
                          : 'text-neutral-300'
                      }`}>
                        {tc.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-300">
                      {tc.type}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-neutral-300">
                      {tc.steps.length}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          tc.status === 'Approved' 
                            ? 'bg-emerald-400' 
                            : tc.status === 'Rejected' 
                            ? 'bg-rose-500' 
                            : 'bg-amber-400'
                        }`} />
                        <span className={`text-xs font-mono ${
                          tc.status === 'Approved' ? 'text-emerald-400' : tc.status === 'Rejected' ? 'text-rose-400' : 'text-neutral-300'
                        }`}>
                          {tc.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCase(tc)}
                        className="p-1 text-neutral-300 hover:text-white rounded hover:bg-white/[0.08] transition-colors"
                        title="View details"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedCase && (
        <TestCaseDetailModal
          testCase={selectedCase}
          isOpen={Boolean(selectedCase)}
          onClose={() => setSelectedCase(null)}
          onUpdate={(updated) => {
            onUpdateTestCase(updated);
            setSelectedCase(updated);
          }}
          onDelete={(id) => {
            onDeleteTestCase(id);
            setSelectedCase(null);
          }}
          onDuplicate={(tc) => {
            onDuplicateTestCase(tc);
            setSelectedCase(null);
          }}
        />
      )}
    </div>
  );
};
