import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Layers, 
  CheckSquare, 
  PlayCircle, 
  Bug as BugIcon, 
  GitFork, 
  Settings as SettingsIcon,
  HelpCircle,
  Activity,
  ShieldCheck,
  ChevronDown,
  Check,
  BrainCircuit,
  Command,
  Plus, LogOut } from 'lucide-react';
import { Project } from '../../types/qa';
import type { AuthUser } from '../../services/api';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
  onToggleCopilot: () => void;
  onToggleLanding: () => void;
  isCopilotOpen: boolean;
  hasGeminiKey: boolean;
  activeProject?: Project;
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  onOpenNewProject?: () => void;
  user?: AuthUser;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenSearch,
  onToggleCopilot,
  onToggleLanding,
  isCopilotOpen,
  hasGeminiKey,
  activeProject,
  projects = [],
  onSelectProject,
  onOpenNewProject,
  user,
  onLogout,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'testcases', label: 'Test Cases', icon: CheckSquare },
    { id: 'runs', label: 'Executions', icon: PlayCircle },
    { id: 'analysis', label: 'Failure Triage', icon: ShieldCheck },
    { id: 'bugs', label: 'Defects', icon: BugIcon },
    { id: 'coverage', label: 'Traceability', icon: GitFork },
    { id: 'projects', label: 'Workspaces', icon: Layers },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full craft-header-blur">
      <div className="flex h-13 items-center justify-between px-3 sm:px-5 max-w-[1560px] mx-auto">
        {/* Left: Brandmark & Project Workspace Selector */}
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          {/* Handcrafted Emblem Logo */}
          <button 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="QA//LAB Quality Engineering Platform"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-[#222733] to-[#141720] border border-white/[0.12] shadow-sm group-hover:border-white/[0.22] transition-colors">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" className="text-white/20" stroke="currentColor" />
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                <path d="M9 12l2 2 4-4" className="text-accent-400" stroke="currentColor" strokeWidth="2.4" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-[13px] tracking-tight text-white group-hover:text-neutral-100 transition-colors">
                QA//LAB
              </span>
            </div>
          </button>

          <span className="text-neutral-700 text-xs hidden sm:inline select-none">/</span>

          {/* Active Workspace / Project Selector */}
          {activeProject && (
            <div className="relative min-w-0" ref={dropdownRef}>
              <button
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.08]"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-accent-400/80" />
                <span className="font-medium max-w-[72px] truncate min-[420px]:max-w-[140px] sm:max-w-[200px]">
                  {activeProject.name}
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-300" />
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-[#141720] border border-white/[0.1] shadow-2xl py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-300 border-b border-white/[0.06]">
                    Active Projects
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject?.(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-white/[0.06] text-neutral-200 transition-colors"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-white truncate">{p.name}</div>
                          <div className="text-[11px] text-neutral-300 font-mono">{p.type}</div>
                        </div>
                        {p.id === activeProject.id && (
                          <Check className="h-3.5 w-3.5 text-accent-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  {onOpenNewProject && (
                    <div className="border-t border-white/[0.06] pt-1">
                      <button
                        onClick={() => {
                          setIsProjectDropdownOpen(false);
                          onOpenNewProject();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-neutral-300" />
                        <span>Create New Project</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Items (Clean Typography with hairline active underline) */}
          <nav className="hidden xl:flex items-center gap-0.5 ml-1 whitespace-nowrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition-colors rounded-md ${
                    isActive
                      ? 'text-white bg-white/[0.08]'
                      : 'text-neutral-300 hover:text-neutral-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-accent-400' : 'text-neutral-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick Search, Engine Status, Copilot Drawer Trigger */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1 text-xs text-neutral-300 hover:text-neutral-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14] rounded-md transition-all shadow-xs"
            title="Search specifications, test runs, and defects (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-neutral-300" />
            <span className="hidden 2xl:inline text-xs font-normal text-neutral-300 whitespace-nowrap">Search…</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/[0.06] text-[11px] rounded text-neutral-300 font-mono border border-white/[0.06]">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Clean Engine Status Indicator */}
          <div 
            className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-300 font-mono bg-white/[0.02] border border-white/[0.06] rounded-md whitespace-nowrap"
            title={hasGeminiKey ? 'Gemini is configured on the server' : 'No API key: AI actions return placeholders'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${hasGeminiKey ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
            <span className="text-[11px] text-neutral-300">{hasGeminiKey ? 'AI connected' : 'AI off (demo)'}</span>
          </div>

          {/* Product Overview Toggle */}
          <button
            onClick={onToggleLanding}
            className="hidden min-[420px]:flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap text-neutral-300 hover:text-neutral-200 hover:bg-white/[0.04] rounded-md transition-colors"
            title="Platform Overview"
          >
            <HelpCircle className="h-3.5 w-3.5 text-neutral-300" />
            <span className="hidden 2xl:inline text-xs">Overview</span>
          </button>

          {/* QA Copilot Drawer Button */}
          <button
            onClick={onToggleCopilot}
            aria-label="QA Copilot"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
              isCopilotOpen
                ? 'bg-accent-500/10 border-accent-500/30 text-accent-300'
                : 'bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.14]'
            }`}
          >
            <BrainCircuit className={`h-3.5 w-3.5 ${isCopilotOpen ? 'text-accent-400' : 'text-neutral-300'}`} />
            <span className="font-medium text-xs hidden sm:inline">QA Copilot</span>
          </button>

          {activeProject?.myRole === 'viewer' && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300" title="You can read this project but not change it">
              read-only
            </span>
          )}

          {user && (
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-white/[0.08]">
              <span className="hidden lg:inline text-xs text-neutral-300 whitespace-nowrap max-w-[140px] truncate" title={user.email}>
                {user.name}{user.role === 'admin' ? ' · admin' : ''}
              </span>
              <button
                onClick={onLogout}
                aria-label="Sign out"
                className="px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-nav for mobile screens */}
      <div className="flex xl:hidden overflow-x-auto px-3 py-1.5 border-t border-white/[0.06] gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs whitespace-nowrap rounded-md ${
                isActive ? 'bg-white/[0.1] text-white font-medium' : 'text-neutral-300 hover:text-neutral-200'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
