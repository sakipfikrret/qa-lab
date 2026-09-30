import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Bug as BugIcon, 
  PlayCircle,
  GitFork,
  ChevronRight,
  BrainCircuit,
  Lock,
  Terminal,
  Activity
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const pipelineSteps = [
    { step: '01', title: 'Requirement Intake', desc: 'Accept natural-language requirements, PRDs, user stories, or architecture briefs.' },
    { step: '02', title: 'AI Test Design', desc: 'Synthesize structured test cases, preconditions, boundary edge cases, and security assertions.' },
    { step: '03', title: 'Execution Runner', desc: 'Record step-by-step manual and automated executions with PASS/FAIL/BLOCKED states.' },
    { step: '04', title: 'Evidence Capture', desc: 'Attach console traces, HTTP payloads, and error logs directly to failed assertions.' },
    { step: '05', title: 'Failure Analysis', desc: 'Gemini analyzes observed failures vs expected behavior to infer root cause with evidence citations.' },
    { step: '06', title: 'Bug Report Generation', desc: 'Instantly generate developer-actionable bug reports with reproduction steps and fix directives.' },
  ];

  return (
    <div className="min-h-screen text-neutral-100 flex flex-col justify-between selection:bg-white/[0.15]">
      {/* Top Bar */}
      <header className="craft-header-blur px-6 py-4 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-[#222733] to-[#141720] border border-white/[0.12] shadow-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" className="text-white/20" stroke="currentColor" />
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              <path d="M9 12l2 2 4-4" className="text-accent-400" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-white">QA//LAB</span>
            <span className="text-[11px] tracking-widest uppercase text-neutral-300 font-mono">Platform</span>
          </div>
        </div>

        <button
          onClick={onLaunchApp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm active:scale-[0.98]"
        >
          <span>Open Console</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16 flex-1">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-mono text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            <span>AI Quality Engineering Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Software testing, with an AI investigation layer.
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
            Turn requirements into test cases, failures into evidence, and test results into actionable engineering insight.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLaunchApp}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Launch QA//LAB Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>


        {/* Product preview (static illustration built from real UI patterns; sample data) */}
        <section aria-label="Product preview" className="space-y-2">
          <div className="craft-card rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] text-xs font-mono text-neutral-300">
              <span>RUN-2026-03-01 · Staging</span>
              <span className="text-rose-400">Failed</span>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
              <div className="p-4 space-y-3 text-xs">
                <div className="font-semibold text-white">TC-AUTH-002 · Concurrent session limit</div>
                <ol className="space-y-1.5">
                  {[
                    ['Log in on device A', 'PASS'],
                    ['Log in on device B', 'PASS'],
                    ['Log in on device C', 'FAIL'],
                  ].map(([label, st], i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-neutral-200">{i + 1}. {label}</span>
                      <span className={`font-mono px-1.5 py-0.5 rounded border ${
                        st === 'PASS' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-rose-300 border-rose-500/30 bg-rose-500/10'
                      }`}>{st}</span>
                    </li>
                  ))}
                </ol>
                <div className="rounded-md bg-black/40 border border-white/[0.08] p-2.5 font-mono text-[11px] text-neutral-300 leading-relaxed">
                  POST /api/session → 500<br />
                  LockTimeoutError: lease not released
                </div>
                <div className="text-neutral-400">Attached evidence · console_log</div>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5"><BrainCircuit className="h-3.5 w-3.5 text-accent-400" />AI triage</span>
                  <span className="font-mono text-neutral-300">Confidence: Medium</span>
                </div>
                <p className="text-neutral-200 leading-relaxed">
                  The third login fails with a lock timeout. The attached log shows the lease was never released after the second session.
                </p>
                <div>
                  <div className="text-neutral-400 mb-1">Cited from your evidence</div>
                  <div className="font-mono text-[11px] text-accent-300">#1 LockTimeoutError: lease not released</div>
                </div>
                <div className="text-neutral-400">Next: check lease expiry in the session lock, then release it in a finally block.</div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-neutral-400">Illustration with sample data. The AI proposes a cause; you confirm it.</p>
        </section>

        <div className="max-w-2xl mx-auto mt-6 text-xs text-neutral-300 border border-white/[0.08] rounded-lg p-4 bg-white/[0.02]">
          <span className="font-semibold text-white">Demo mode: </span>
          Without a GEMINI_API_KEY the app runs on seeded sample data and AI actions return clearly labelled placeholders, not real analysis. Sign-in is required; data is stored in a local SQLite database on the server.
        </div>

        {/* The Pipeline Workflow */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono">
              The Quality Engineering Pipeline
            </h2>
            <p className="text-sm font-semibold text-white">From requirement to a reproducible bug report</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pipelineSteps.map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-lg craft-card space-y-2 hover:border-white/[0.14] transition-all"
              >
                <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                  <span>STAGE {item.step}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/[0.08]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <BrainCircuit className="h-4 w-4 text-accent-400" />
              <span>Grounded AI Reasoning</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              AI output is constrained to the evidence you attach. Gemini analyzes supplied error payloads, stack traces, and specification constraints to form calibrated diagnostic hypotheses.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <GitFork className="h-4 w-4 text-neutral-300" />
              <span>Full-Lineage Traceability</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Every bug is linked back to a failed test step, which links to a test case, which links back to a specification requirement. Each defect can be traced back to its test and requirement.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-neutral-300" />
              <span>Built for engineers</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Keyboard-first (⌘K search), monospace technical output, and every AI claim tied to evidence you attached.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-6 text-center text-xs text-neutral-300">
        QA//LAB · Quality engineering workspace · AI by Gemini
      </footer>
    </div>
  );
};
