import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Bug as BugIcon, PlayCircle, Layers, ArrowUpRight } from 'lucide-react';
import { TestCase, Bug, TestRun, Requirement } from '../../types/qa';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: TestCase[];
  bugs: Bug[];
  testRuns: TestRun[];
  onSelectTestCase: (tc: TestCase) => void;
  onSelectBug: (bug: Bug) => void;
  onSelectRun: (run: TestRun) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  testCases,
  bugs,
  testRuns,
  onSelectTestCase,
  onSelectBug,
  onSelectRun,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCases = testCases.filter(tc => 
    tc.title.toLowerCase().includes(query.toLowerCase()) || 
    tc.code.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredBugs = bugs.filter(b => 
    b.title.toLowerCase().includes(query.toLowerCase()) || 
    b.bugId.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredRuns = testRuns.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.runId.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  return (
    <div role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="w-full max-w-xl rounded-xl craft-card shadow-2xl overflow-hidden text-xs">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3 bg-[#11141c]">
          <Search className="h-4 w-4 text-neutral-300" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search specifications, defects, or test execution runs..."
            className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-neutral-400 text-sm"
          />
          <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.08] text-[11px] text-neutral-300 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2.5 space-y-3 bg-[#0c0e14]">
          {/* Test Cases */}
          {filteredCases.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Specifications ({filteredCases.length})
              </div>
              <div className="space-y-0.5">
                {filteredCases.map(tc => (
                  <div
                    key={tc.id}
                    onClick={() => {
                      onSelectTestCase(tc);
                      onClose();
                    }}
                    className="p-2.5 rounded-md hover:bg-white/[0.04] flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-3.5 w-3.5 text-neutral-300 group-hover:text-accent-400" />
                      <span className="font-mono text-white font-medium">{tc.code}</span>
                      <span className="text-neutral-200 line-clamp-1">{tc.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">{tc.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bugs */}
          {filteredBugs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Defects ({filteredBugs.length})
              </div>
              <div className="space-y-0.5">
                {filteredBugs.map(b => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onSelectBug(b);
                      onClose();
                    }}
                    className="p-2.5 rounded-md hover:bg-white/[0.04] flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BugIcon className="h-3.5 w-3.5 text-rose-400" />
                      <span className="font-mono text-white font-medium">{b.bugId}</span>
                      <span className="text-neutral-200 line-clamp-1">{b.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Runs */}
          {filteredRuns.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Execution Runs ({filteredRuns.length})
              </div>
              <div className="space-y-0.5">
                {filteredRuns.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onSelectRun(r);
                      onClose();
                    }}
                    className="p-2.5 rounded-md hover:bg-white/[0.04] flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-3.5 w-3.5 text-neutral-300 group-hover:text-accent-400" />
                      <span className="font-mono text-white font-medium">{r.runId}</span>
                      <span className="text-neutral-200 line-clamp-1">{r.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">{r.environment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredCases.length === 0 && filteredBugs.length === 0 && filteredRuns.length === 0 && (
            <div className="py-8 text-center text-neutral-400">
              No matching specifications, defects, or runs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
