# QA//LAB

> **Software testing, with an AI investigation layer.**  
> Turn requirements into test cases, failures into evidence, and test results into actionable engineering insight.

QA//LAB is an **AI-assisted software testing and quality engineering platform** engineered with developer-tool ergonomics (Linear / Vercel aesthetic). It addresses the core disconnect in modern QA: testing tools either drown engineers in manual administrative overhead or offer flashy AI chatbots that hallucinate untestable steps.

QA//LAB implements a continuous, grounded Quality Engineering loop:

```
Requirement → AI Test Design → Test Execution → Evidence Intake → AI Forensic Analysis → Bug Report
```

---

## 1. The Core Problem It Solves

1. **Specification Ambiguity**: Features are specified in informal user stories or PRDs that gloss over negative boundaries, race conditions, and error states.
2. **Disconnected Failure Triage**: When a test fails in staging or CI, developers spend hours jumping between Sentry, Datadog, browser consoles, and Jira trying to reconstruct the root cause.
3. **Evidence Amnesia**: Bug reports are frequently filed without actionable evidence, missing reproduction steps, or lacking exact error payloads.
4. **Untracked Regressions**: Organizations rarely have full-lineage traceability connecting a production bug back to the exact test case and original requirement specification.

---

## 2. Core Architecture

QA//LAB is architected as a **full-stack developer application** with a clean separation of concerns:

- **Frontend**: React 19 SPA running on Vite with TypeScript, Tailwind CSS, and Lucide icons.
- **Backend**: Express server with session-based auth (`/api/*`), hosting the Vite dev middleware in development and static assets in production.
- **AI Investigation Layer**: Powered server-side by `@google/genai` utilizing a Gemini model (set with `GEMINI_MODEL`, default `gemini-2.5-flash`).
- **Data Persistence**: SQLite via Node's built-in `node:sqlite` (`data/qalab.db`, WAL mode, transactional writes). Users and sessions live in the same database. Without an API key, AI actions return clearly labelled placeholders.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Client UI                   │
│  Dashboard · AI Test Designer · Test Runner · Triage  │
└───────────────────────────▲────────────────────────────┘
                            │ REST APIs (/api/*)
┌───────────────────────────▼────────────────────────────┐
│                  Express Node Server                   │
│   Auth · Test Manager · AI Prompt Layer · SQLite       │
└───────────────────────────▲────────────────────────────┘
                            │ Server-side SDK
┌───────────────────────────▼────────────────────────────┐
│           Gemini (Google GenAI)              │
│  Test Generation · Failure Triage · Risk Scanner      │
└────────────────────────────────────────────────────────┘
```

---

## 3. The 6-Stage AI Quality Pipeline

### Stage 1: Requirement Intake & Risk Scanning
Users submit natural-language requirements, PRDs, or architecture briefs. The **Requirement Risk Scanner** identifies:
- Missing acceptance criteria
- Unhandled state transitions
- Authentication & authorization loopholes
- Concurrency and distributed locking vulnerabilities

### Stage 2: AI Test Designer
Gemini translates requirements into structured, testable specifications containing:
- Test ID (`TC-AUTH-001`)
- Priority (`Critical`, `High`, `Medium`, `Low`)
- Type (`Functional`, `Security`, `Regression`, `Performance`, `Edge Case`, `Negative Test`)
- Verified preconditions
- Granular action-and-expected steps
- Quality risk evaluation and AI justification notes

### Stage 3: Interactive Execution Runner
Engineers execute test cases step-by-step with `PASS`, `FAIL`, and `BLOCKED` controls. Execution timers and pass rates update in real time.

### Stage 4: Evidence Capture
When a step fails, engineers attach concrete diagnostic evidence:
- Browser console traces
- HTTP request/response payloads
- Stack traces and exceptions
- Qualitative execution notes

### Stage 5: Forensic AI Failure Triage
With one click, Gemini investigates the failed test by cross-referencing:
- Expected result vs. actual observed outcome
- Attached raw evidence and error messages
- Execution environment context

Gemini outputs:
1. **Failure Summary**: Concise engineering description
2. **Probable Cause**: Root cause hypothesis (e.g., Redis lease lock deadlock)
3. **Grounded Citations**: Direct citations of supplied logs (never invented)
4. **Calibrated Confidence**: `High`, `Medium`, or `Low`
5. **Concrete Next Investigation**: Actionable debugging checklist
6. **Regression Risk & Fix Direction**

### Stage 6: Actionable Bug Generation
Transforms the forensic investigation into a formal defect report with reproduction steps, preconditions, environment, assigned owner, and activity history.

---

## 4. Domain Data Model

The data model establishes explicit relational lineage across the entire software development lifecycle:

```
Project (1) ──────────< Requirement (N)
   │                           │
   │ (1)                       │ (1)
   ▼                           ▼
TestRun (N) ──────────< TestCase (N)
   │                           │
   │ (1)                       │ (1)
   ▼                           ▼
TestResult (N) <───────────────┘
   │
   ├──────────< Evidence (N)
   │
   ├─────────── AIFailureAnalysis (1)
   │
   └─────────── Bug (1)
```

- **Project**: Target system under test (Web App, API, Mobile App, Custom).
- **Requirement**: Code (`REQ-AUTH-001`), title, priority, risks, and acceptance criteria.
- **TestCase**: Code (`TC-AUTH-001`), preconditions, steps, expected result, priority, and tags.
- **TestRun**: Environment (`Staging`, `Preview`, `Production`, `Local`), duration, status, and summary metrics.
- **TestResult**: Step outcomes (`PASS` / `FAIL` / `BLOCKED`), actual result, error message, evidence IDs.
- **Evidence**: Grounded diagnostic artifacts (`console_log`, `network_log`, `error_message`, `notes`).
- **AIFailureAnalysis**: Root cause hypothesis, confidence level, investigation steps, regression risk.
- **Bug**: Structured defect ticket (`BUG-101`) with reproduction steps, status, assignee, and timeline history.

---

## 5. Security Model

- **Authentication**: email + password (scrypt, per-user salt), server-side sessions in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production). The first account created becomes the admin; afterwards admins add people in Settings → Team (or set `ALLOW_SIGNUP=true`).
- **Password management**: users change their own password (other devices are signed out). There is no email service, so an admin issues a one-time reset link (valid 60 minutes, stored hashed, single use) that the user opens to choose a new password.
- **Roles**: *workspace* roles are `admin` (manages users, can see every project, reset demo data, download backups) and `member`. *Project* roles are `viewer` (read), `editor` (change tests, runs, bugs) and `owner` (also manage access). People you have not added to a project get a 404, not a 403, so project existence is not leaked.
- **Attribution**: every run result, bug and history entry records who did it.
- **Request hardening**: same-origin check on writes, login rate limit (10 / 15 min per IP + email), per-user AI rate limit (20 / min), 1 MB body limit, allow-listed fields on updates, enum and shape validation on every write, JSON error responses (no stack pages), strict CSP in production, optional `TRUST_PROXY` for deployments behind a reverse proxy.
- **API key**: `GEMINI_API_KEY` is read only in `server.ts`; the client bundle never contains it. Gemini calls time out after 45 s (`GEMINI_TIMEOUT_MS`).
- **Grounded prompts**: prompts tell the model to cite only supplied evidence and to treat user text as data, not instructions. AI output is normalised to known enums and saved as `Needs Review`. This reduces, but does not eliminate, hallucination and prompt-injection risk.
- **Without an API key** no analysis is invented: risk scans return nothing, failure triage says "not determined", generated test cases are generic templates flagged for review.
- **Backups**: admins can download a consistent SQLite snapshot (Settings → Backup, or `GET /api/admin/backup`). It contains password hashes; treat it as sensitive. The process also checkpoints and closes the database cleanly on SIGTERM/SIGINT.
- **Repository URLs** are stored as metadata only; nothing is cloned or executed.

## 6. Local Setup & Execution

### Prerequisites
- Node.js 22.13 or newer (uses the built-in `node:sqlite`, which Node still labels experimental)
- npm

### Quickstart

```bash
npm install
cp .env.example .env      # optionally add GEMINI_API_KEY
npm run dev               # http://localhost:3000
```

On first visit, create the admin account. For production: `npm run build && NODE_ENV=production npm start` (behind HTTPS).

Local single-user shortcut: `AUTH_DISABLED=true npm run dev` skips sign-in. The server refuses to start with this flag when `NODE_ENV=production`.

Run everything:

```bash
npm run lint        # type-check
npm test            # component tests + API/integration tests (auth, access control, AI paths with a fake client)
npm run build && npx playwright install chromium && npm run test:e2e   # browser end-to-end tests
```

---

## 7. Demo Usage & Portfolio Walkthrough

QA//LAB includes a pre-seeded **Core Demo Application** (`QA//LAB Core Demo Application`):

1. **Dashboard**: View active metrics, 84% test health distribution bar, recent test runs, and open bugs.
2. **AI Test Designer**: Select an existing requirement (e.g. `REQ-AUTH-002`) or paste custom requirements. Click **"Generate Structured Test Cases"** to watch Gemini synthesize test scenarios with edge cases.
3. **Execution Runner**: Open run `RUN-2026-03-01`. Walk through the execution queue, toggle step statuses between `PASS`, `FAIL`, and `BLOCKED`, and inspect the attached Redis lock timeout evidence.
4. **AI Failure Analysis**: Navigate to `TC-AUTH-002` failure triage. Click **"Run Failure Analysis"** to see Gemini infer the concurrency deadlock with high confidence and cited log evidence.
5. **Bug Report Generator**: Click **"Create Formal Bug Report"** to inspect how the triage immediately turns into `BUG-101` in the bug tracker with full reproduction steps.
6. **Traceability Matrix**: View how requirements map directly into test cases, execution runs, and production bug tickets.

---

## 8. Known Limitations

- Single-process server with a local SQLite file: fine for a team workspace, not for horizontal scaling. Scaling out would need a server database and a shared session store.
- No email: password resets are admin-issued links, and email addresses are not verified.
- No SSO / OAuth / 2FA.
- Viewers are blocked by the server and get a "read-only" badge, but write buttons are not individually hidden in the UI yet.
- AI features are covered by tests with a fake client; they have not been run against the live Gemini API in this repo's tests. Set `GEMINI_API_KEY` and try them once before relying on them.
- About ten form labels in rarely used screens are still not programmatically tied to their inputs; accessibility has not had a full audit.
- `node:sqlite` is marked experimental by Node and prints a warning at startup.
- AI-generated test cases are saved as `Needs Review`; a human must approve them.
- Steps start unmarked; a test cannot be saved as passed until every step is marked.

## 9. Future Roadmap

- **CI/CD Webhook Ingestion**: Ingest JUnit XML, Playwright JSON, and Cypress execution traces directly via authenticated API webhooks.
- **Automated Regression Slicing**: When code diffs are pushed to GitHub, Gemini identifies only the exact subset of test cases that need re-execution.
- **Flaky Test Heuristic Engine**: Track step duration variance across runs to flag flaky assertions before they cause release delays.
- **Jira & Linear Bidirectional Sync**: Push generated bug reports directly to Linear issues with linked evidence attachments.

---

## License

Apache-2.0
