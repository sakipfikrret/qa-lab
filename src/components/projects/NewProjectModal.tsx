import React, { useState } from 'react';
import { X, Layers, Loader2, Info, BrainCircuit } from 'lucide-react';
import { Project, ProjectType } from '../../types/qa';
import { useEscapeKey } from '../../lib/useEscapeKey';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Partial<Project>, analyzeImmediately: boolean) => Promise<void>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('Web Application');
  const [targetUrl, setTargetUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('TypeScript, Next.js, Express, PostgreSQL');
  const [rawRequirements, setRawRequirements] = useState(
    `Users can register with email and password.\nUsers can log in with multi-factor authentication.\nUsers can reset their password with time-bound signed token.\nAuthenticated users can update profile and manage workspace seats.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyzeImmediately, setAnalyzeImmediately] = useState(true);

  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  const projectTypes: ProjectType[] = [
    'Web Application',
    'API',
    'Mobile Application',
    'Software Project',
    'Custom'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const techStack = techStackInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onCreateProject({
        name: name.trim(),
        description: description.trim(),
        type,
        targetUrl: targetUrl.trim(),
        repoUrl: repoUrl.trim(),
        techStack,
        rawRequirements: rawRequirements.trim(),
      }, analyzeImmediately);
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="w-full max-w-2xl rounded-xl craft-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] border border-white/[0.1] text-accent-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Initialize Project Workspace</h2>
              <p className="text-xs text-neutral-300">Configure target environment and specifications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-300 hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2 font-mono uppercase text-[11px]">
              Target Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {projectTypes.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-2.5 py-2 text-xs rounded-md border text-center transition-all ${
                    type === t
                      ? 'border-white/[0.22] bg-white/[0.12] text-white font-medium shadow-xs'
                      : 'border-white/[0.06] bg-[#101217] text-neutral-300 hover:text-neutral-200 hover:border-white/[0.1]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Project Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Billing Engine"
                className="w-full px-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Tech Stack (comma-separated)</label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="TypeScript, Next.js, Node.js, PostgreSQL"
                className="w-full px-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Scope Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary functional boundaries and release goals"
              className="w-full px-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-600"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Target Staging URL (optional)</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://staging.internal.io"
                className="w-full px-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Repository URL (optional)</label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                className="w-full px-3 py-1.5 text-xs bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Requirements Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-300">
                Natural-Language Acceptance Criteria & User Stories
              </label>
              <span className="text-xs text-neutral-400 font-mono">Parsed into test cases</span>
            </div>
            <textarea
              rows={5}
              value={rawRequirements}
              onChange={(e) => setRawRequirements(e.target.value)}
              placeholder="e.g.&#10;Users can register with email and password.&#10;Users can log in.&#10;Users can reset password.&#10;Authenticated users can update their profile."
              className="w-full px-3 py-2 text-xs font-mono bg-[#101217] border border-white/[0.08] rounded-md text-white focus:outline-none focus:border-white/[0.2] placeholder:text-neutral-600 leading-relaxed resize-y"
            />
          </div>

          {/* AI Immediate Processing Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="analyzeImmediately"
              checked={analyzeImmediately}
              onChange={(e) => setAnalyzeImmediately(e.target.checked)}
              className="rounded bg-neutral-900 border-neutral-700 text-accent-500 focus:ring-0 focus:outline-none cursor-pointer"
            />
            <label htmlFor="analyzeImmediately" className="text-xs text-neutral-300 flex items-center gap-1.5 cursor-pointer">
              <BrainCircuit className="h-3.5 w-3.5 text-accent-400" />
              <span>Automatically audit requirements and synthesize initial test cases upon creation</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-md border border-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all shadow-sm active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
