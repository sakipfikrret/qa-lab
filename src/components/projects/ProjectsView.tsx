import React from 'react';
import { Layers, Plus, ExternalLink, GitBranch, CheckSquare, PlayCircle, Bug as BugIcon, Check, ArrowRight } from 'lucide-react';
import { Project, Requirement, TestCase, TestRun, Bug } from '../../types/qa';

interface ProjectsViewProps {
  projects: Project[];
  requirements: Requirement[];
  testCases: TestCase[];
  testRuns: TestRun[];
  bugs: Bug[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  onNavigate: (tab: string, context?: any) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  requirements,
  testCases,
  testRuns,
  bugs,
  selectedProjectId,
  onSelectProject,
  onOpenNewProject,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Project Workspaces</h1>
            <span className="font-mono text-xs text-neutral-300">({projects.length} configured)</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Manage target application environments, architectural specifications, and regression test suites
          </p>
        </div>

        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-900" />
          <span>New Project Workspace</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          const projReqs = requirements.filter(r => r.projectId === proj.id);
          const projCases = testCases.filter(t => t.projectId === proj.id);
          const projRuns = testRuns.filter(r => r.projectId === proj.id);
          const projBugs = bugs.filter(b => b.projectId === proj.id);

          return (
            <div
              key={proj.id}
              className={`p-5 rounded-lg craft-card transition-all ${
                isSelected
                  ? 'border-white/[0.18] shadow-md ring-1 ring-white/[0.1]'
                  : 'hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-300 uppercase tracking-wider">{proj.type}</span>
                    {proj.isDemo && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-300 border border-white/[0.08]">
                        Demo Workspace
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">{proj.name}</h3>
                </div>

                <button
                  onClick={() => onSelectProject(proj.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-all ${
                    isSelected
                      ? 'bg-white/[0.14] border-white/[0.22] text-white font-medium shadow-xs'
                      : 'border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Active</span>
                    </>
                  ) : (
                    <span>Set Active</span>
                  )}
                </button>
              </div>

              <p className="text-xs text-neutral-300 mb-4 line-clamp-2 leading-relaxed">
                {proj.description || 'No description provided.'}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {proj.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 text-xs font-mono text-neutral-300 bg-[#0d0f14] border border-white/[0.06] rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 py-3 border-t border-b border-white/[0.06] mb-4 text-center">
                <div>
                  <div className="text-xs font-semibold font-mono text-white">{projReqs.length}</div>
                  <div className="text-[11px] text-neutral-300 font-mono">Specs</div>
                </div>
                <div>
                  <div className="text-xs font-semibold font-mono text-white">{projCases.length}</div>
                  <div className="text-[11px] text-neutral-300 font-mono">Tests</div>
                </div>
                <div>
                  <div className="text-xs font-semibold font-mono text-white">{projRuns.length}</div>
                  <div className="text-[11px] text-neutral-300 font-mono">Runs</div>
                </div>
                <div>
                  <div className="text-xs font-semibold font-mono text-white">{projBugs.length}</div>
                  <div className="text-[11px] text-neutral-300 font-mono">Defects</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectProject(proj.id);
                      onNavigate('testcases', { focusDesigner: true });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-all"
                  >
                    <span>Design Tests</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectProject(proj.id);
                      onNavigate('coverage');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-300 hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-md transition-all"
                  >
                    <span>Traceability</span>
                  </button>
                </div>

                {proj.targetUrl && (
                  <a
                    href={proj.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Target URL</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
