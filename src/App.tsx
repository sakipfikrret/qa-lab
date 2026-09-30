import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { NewProjectModal } from './components/projects/NewProjectModal';
import { TestDesigner } from './components/designer/TestDesigner';
import { TestCaseList } from './components/testcases/TestCaseList';
import { TestRunsView } from './components/testrunner/TestRunsView';
import { TestExecutionRunner } from './components/testrunner/TestExecutionRunner';
import { FailureAnalysisView } from './components/analysis/FailureAnalysisView';
import { BugsView } from './components/bugs/BugsView';
import { TraceabilityCoverageView } from './components/coverage/TraceabilityCoverageView';
import { SettingsView } from './components/settings/SettingsView';
import { LandingPage } from './components/landing/LandingPage';
import { QACopilotDrawer } from './components/copilot/QACopilotDrawer';
import { CommandPaletteModal } from './components/search/CommandPaletteModal';

import { Project, Requirement, TestCase, TestRun, Bug, QAInsight, TestResult, AIFailureAnalysis } from './types/qa';
import { api, AuthUser } from './services/api';
import { AuthScreen } from './components/auth/AuthScreen';

function Workspace({ user, onLogout, onShowLanding }: { user: AuthUser; onLogout: () => void; onShowLanding: () => void }) {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  // Entities state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [insights, setInsights] = useState<QAInsight[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sub-views & Modals
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [showTestDesigner, setShowTestDesigner] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | undefined>(undefined);
  const [failureAnalysisContext, setFailureAnalysisContext] = useState<{
    testCase?: TestCase | null;
    result?: TestResult | null;
  }>({});

  // Engine state
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Selected project object
  const activeProject: Project = projects.find(p => p.id === selectedProjectId) || projects[0] || {
    id: '', name: 'No project', description: '', type: 'Custom', techStack: [], createdAt: '', updatedAt: '',
  };

  // Filtered entities for active project
  const projectRequirements = requirements.filter(r => r.projectId === activeProject.id);
  const projectTestCases = testCases.filter(t => t.projectId === activeProject.id);
  const projectTestRuns = testRuns.filter(r => r.projectId === activeProject.id);
  const projectBugs = bugs.filter(b => b.projectId === activeProject.id);
  const projectInsights = insights.filter(i => i.projectId === activeProject.id);

  // Initial load from backend API
  const loadData = async () => {
    setLoadError(null);
    try {
      const health = await api.getEngine();
      setHasGeminiKey(health.hasGeminiKey);

      const projs = await api.getProjects();
      setProjects(projs);
      setSelectedProjectId(prev => (projs.some(p => p.id === prev) ? prev : projs[0]?.id ?? ''));
      const all = await Promise.all(projs.map(p => api.getProjectDetails(p.id)));
      setRequirements(all.flatMap(d => d.requirements || []));
      setTestCases(all.flatMap(d => d.testCases || []));
      setTestRuns(all.flatMap(d => d.testRuns || []));
      setBugs(all.flatMap(d => d.bugs || []));
      setInsights(all.flatMap(d => d.insights || []));
    } catch (err: any) {
      // A 401 is handled globally (back to sign-in). Anything else is a real failure: say so, never show fake data.
      setLoadError(err?.message || 'Could not load your workspace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation router with context passing
  const handleNavigate = (tab: string, context?: any) => {
    setCurrentTab(tab);

    if (tab === 'testcases' && context?.focusDesigner) {
      setShowTestDesigner(true);
    } else {
      setShowTestDesigner(false);
    }

    if (tab === 'runs' && context?.selectedRunId) {
      setActiveRunId(context.selectedRunId);
    }

    if (tab === 'bugs' && context?.selectedBugId) {
      setSelectedBugId(context.selectedBugId);
    }

    if (tab === 'analysis' && context?.testCase && context?.result) {
      setFailureAnalysisContext({
        testCase: context.testCase,
        result: context.result,
      });
    }
  };

  // Create Project
  const handleCreateProject = async (projectData: Partial<Project>, analyzeImmediately: boolean) => {
    try {
      const newProj = await api.createProject(projectData);
      setProjects(prev => [newProj, ...prev]);
      setSelectedProjectId(newProj.id);

      if (analyzeImmediately && newProj.rawRequirements) {
        const analysisRes = await api.analyzeRequirements({
          projectId: newProj.id,
          rawText: newProj.rawRequirements,
          projectName: newProj.name,
          techStack: newProj.techStack,
        });

        if (analysisRes.requirements) {
          setRequirements(prev => [...analysisRes.requirements, ...prev]);
        }
        if (analysisRes.insights) {
          setInsights(prev => [...analysisRes.insights, ...prev]);
        }
      }

      handleNavigate('testcases', { focusDesigner: true });
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Create Test Run
  const handleCreateTestRun = async (data: { name: string; environment: string; testCaseIds: string[] }) => {
    try {
      const newRun = await api.createTestRun({
        projectId: activeProject.id,
        name: data.name,
        environment: data.environment,
        testCaseIds: data.testCaseIds,
      });
      setTestRuns(prev => [newRun, ...prev]);
      setActiveRunId(newRun.id);
      setCurrentTab('runs');
    } catch (err) {
      console.error('Failed to create test run:', err);
    }
  };

  // Update Test Run Result
  const handleUpdateTestRunResult = async (testCaseId: string, resultData: Partial<TestResult>) => {
    if (!activeRunId) return;
    try {
      const { run } = await api.updateTestRunResult(activeRunId, {
        testCaseId,
        ...resultData,
      });
      setTestRuns(prev => prev.map(r => r.id === run.id ? run : r));
    } catch (err) {
      console.error('Failed to update result:', err);
    }
  };

  // Create Bug from Failure Analysis
  const handleCreateBugFromAnalysis = async (data: {
    testCase: TestCase;
    testResult: TestResult;
    analysis: AIFailureAnalysis;
  }) => {
    try {
      const res = await api.generateBugReport({
        testCase: data.testCase,
        testResult: data.testResult,
        analysis: data.analysis,
        projectId: activeProject.id,
      });

      if (res.bug) {
        setBugs(prev => [res.bug, ...prev]);
        setSelectedBugId(res.bug.id);
        setCurrentTab('bugs');
      }
    } catch (err) {
      console.error('Failed to generate bug report:', err);
    }
  };

  // Update Bug
  const handleUpdateBug = async (id: string, updates: Partial<Bug> & { note?: string }) => {
    try {
      const updated = await api.updateBug(id, updates);
      setBugs(prev => prev.map(b => b.id === id ? updated : b));
    } catch (err) {
      console.error('Failed to update bug:', err);
    }
  };

  // Reset Demo Data
  const handleResetData = async () => {
    await api.resetDemoData();
    await loadData();
  };

  const activeRun = testRuns.find(r => r.id === activeRunId);

  return (
    <div className="min-h-screen text-neutral-100 flex flex-col selection:bg-white/[0.15]">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setActiveRunId(null);
          setShowTestDesigner(false);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        onToggleLanding={onShowLanding}
        user={user}
        onLogout={onLogout}
        isCopilotOpen={isCopilotOpen}
        hasGeminiKey={hasGeminiKey}
        activeProject={activeProject}
        projects={projects}
        onSelectProject={(id) => setSelectedProjectId(id)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 sm:p-6 lg:p-7">
        {loadError ? (
          <div role="alert" className="max-w-lg mx-auto mt-16 craft-card rounded-lg p-6 space-y-3 text-center">
            <h2 className="text-base font-semibold text-white">Couldn't load your workspace</h2>
            <p className="text-xs text-neutral-300">{loadError}</p>
            <button onClick={() => { setIsLoading(true); loadData(); }} className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md">Try again</button>
          </div>
        ) : isLoading ? (
          <div role="status" className="text-center text-sm text-neutral-300 mt-16">Loading workspace…</div>
        ) : projects.length === 0 && currentTab !== 'settings' ? (
          <div className="max-w-lg mx-auto mt-16 craft-card rounded-lg p-6 space-y-3 text-center">
            <h2 className="text-base font-semibold text-white">No projects yet</h2>
            <p className="text-xs text-neutral-300">
              {user.role === 'admin'
                ? 'Create your first project to start designing and running tests.'
                : 'You have not been added to a project yet. Create your own, or ask a project owner to add you.'}
            </p>
            <button onClick={() => setIsNewProjectOpen(true)} className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md">Create a project</button>
          </div>
        ) : (
          <>
        {currentTab === 'dashboard' && (
          <DashboardView
            projects={projects}
            testCases={testCases}
            testRuns={testRuns}
            bugs={bugs}
            insights={insights}
            onNavigate={handleNavigate}
            onOpenNewRun={() => {
              setCurrentTab('runs');
            }}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsView
            projects={projects}
            requirements={requirements}
            testCases={testCases}
            testRuns={testRuns}
            bugs={bugs}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'testcases' && (
          showTestDesigner ? (
            <TestDesigner
              project={activeProject}
              requirements={projectRequirements}
              onTestCasesGenerated={(newCases) => {
                setTestCases(prev => [...newCases, ...prev]);
                setShowTestDesigner(false);
              }}
              onNavigateToCases={() => setShowTestDesigner(false)}
            />
          ) : (
            <TestCaseList
              project={activeProject}
              testCases={projectTestCases}
              requirements={projectRequirements}
              onOpenDesigner={() => setShowTestDesigner(true)}
              onUpdateTestCase={(updated) => {
                setTestCases(prev => prev.map(t => t.id === updated.id ? updated : t));
                api.updateTestCase(updated.id, updated).catch(e => console.error('Persist update failed:', e));
              }}
              onDeleteTestCase={(id) => {
                setTestCases(prev => prev.filter(t => t.id !== id));
                api.deleteTestCase(id).catch(e => console.error('Persist delete failed:', e));
              }}
              onDuplicateTestCase={(tc) => {
                const dup: TestCase = {
                  ...tc,
                  id: `tc-${Date.now()}`,
                  code: `${tc.code}-COPY`,
                  title: `${tc.title} (Copy)`,
                  createdAt: new Date().toISOString(),
                };
                setTestCases(prev => [dup, ...prev]);
                api.createTestCase(dup).then(saved => setTestCases(p => p.map(t => t.id === dup.id ? saved : t))).catch(e => console.error('Persist duplicate failed:', e));
              }}
            />
          )
        )}

        {currentTab === 'runs' && (
          activeRunId && activeRun ? (
            <TestExecutionRunner
              testRun={activeRun}
              testCases={testCases.filter(t => activeRun.testCaseIds.includes(t.id))}
              onBack={() => setActiveRunId(null)}
              onUpdateRunResult={handleUpdateTestRunResult}
              onTriggerFailureAnalysis={(testCase, result) => {
                handleNavigate('analysis', { testCase, result });
              }}
            />
          ) : (
            <TestRunsView
              project={activeProject}
              testRuns={projectTestRuns}
              testCases={projectTestCases}
              onSelectRun={(runId) => setActiveRunId(runId)}
              onCreateRun={handleCreateTestRun}
            />
          )
        )}

        {currentTab === 'analysis' && (
          <FailureAnalysisView
            testCases={testCases}
            testRuns={testRuns}
            initialTestCase={failureAnalysisContext.testCase}
            initialResult={failureAnalysisContext.result}
            onCreateBugFromAnalysis={handleCreateBugFromAnalysis}
            onNavigateToBugs={() => setCurrentTab('bugs')}
          />
        )}

        {currentTab === 'bugs' && (
          <BugsView
            project={activeProject}
            bugs={projectBugs}
            selectedBugId={selectedBugId}
            onUpdateBug={handleUpdateBug}
            onNavigateToAnalysis={() => setCurrentTab('analysis')}
          />
        )}

        {currentTab === 'coverage' && (
          <TraceabilityCoverageView
            project={activeProject}
            requirements={projectRequirements}
            testCases={projectTestCases}
            testRuns={projectTestRuns}
            bugs={projectBugs}
            onNavigateToDesigner={() => {
              setCurrentTab('testcases');
              setShowTestDesigner(true);
            }}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            hasGeminiKey={hasGeminiKey}
            user={user}
            project={activeProject}
            onDataReset={handleResetData}
            stats={{
              projectsCount: projects.length,
              testCasesCount: testCases.length,
              testRunsCount: testRuns.length,
              bugsCount: bugs.length,
            }}
          />
        )}
          </>
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* AI QA Copilot Slide-out Drawer */}
      <QACopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        project={activeProject}
      />

      {/* Global Command Palette Modal (Cmd+K) */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        testCases={testCases}
        bugs={bugs}
        testRuns={testRuns}
        onSelectTestCase={(tc) => {
          setSelectedProjectId(tc.projectId);
          setCurrentTab('testcases');
        }}
        onSelectBug={(b) => {
          setSelectedProjectId(b.projectId);
          setSelectedBugId(b.id);
          setCurrentTab('bugs');
        }}
        onSelectRun={(r) => {
          setSelectedProjectId(r.projectId);
          setActiveRunId(r.id);
          setCurrentTab('runs');
        }}
      />
    </div>
  );
}

export default function App() {
  const hasResetParam = () => new URLSearchParams(window.location.search).has('reset');
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    if (hasResetParam()) return false;
    try { return !localStorage.getItem('qalab_has_visited'); } catch { return false; }
  });
  const [resetPending, setResetPending] = useState<boolean>(hasResetParam);
  const [phase, setPhase] = useState<'loading' | 'anon' | 'ready'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [auth, setAuth] = useState<{ needsSetup: boolean; signupOpen: boolean }>({ needsSetup: false, signupOpen: false });
  const [bootError, setBootError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const st = await api.authStatus();
      setAuth({ needsSetup: st.needsSetup, signupOpen: st.signupOpen });
      setUser(st.user);
      setPhase(st.user ? 'ready' : 'anon');
      setBootError(null);
    } catch (e: any) {
      setBootError(e?.message || 'Cannot reach the server');
      setPhase('anon');
    }
  };

  useEffect(() => {
    refresh();
    const onUnauth = () => { setUser(null); setPhase('anon'); };
    window.addEventListener('qalab:unauthorized', onUnauth);
    return () => window.removeEventListener('qalab:unauthorized', onUnauth);
  }, []);

  if (showLanding) {
    return (
      <LandingPage
        onLaunchApp={() => {
          try { localStorage.setItem('qalab_has_visited', 'true'); } catch {}
          setShowLanding(false);
        }}
      />
    );
  }

  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-300" role="status">Loading…</div>;
  }

  if (resetPending || phase === 'anon' || !user) {
    return (
      <AuthScreen
        needsSetup={auth.needsSetup}
        signupOpen={auth.signupOpen}
        bootError={bootError}
        onRetry={refresh}
        onAuthenticated={(u) => { setResetPending(false); setUser(u); setPhase('ready'); }}
      />
    );
  }

  return (
    <Workspace
      key={user.id}
      user={user}
      onShowLanding={() => setShowLanding(true)}
      onLogout={async () => { try { await api.logout(); } catch {} setUser(null); setPhase('anon'); refresh(); }}
    />
  );
}
