# QA//LAB

> **AI-assisted Quality Engineering, built around the investigation loop.**
>
> Turn requirements into testable scenarios, turn failures into evidence, and turn evidence into actionable defects.

QA//LAB is a full-stack **Quality Engineering workspace** for managing the path from requirement to defect:

```text
Requirement
    ↓
Risk Scan
    ↓
AI Test Design
    ↓
Test Execution
    ↓
Evidence
    ↓
AI Failure Triage
    ↓
Bug / Regression Insight
```

The goal is not to replace QA engineers with a chatbot. QA//LAB treats AI as an **investigation layer** inside a traceable testing workflow, with human review gates, evidence grounding, and explicit uncertainty.

---

## Why QA//LAB?

Traditional test-management workflows often split the actual investigation across multiple places: requirements in one tool, test cases in another, logs in a terminal, failures in CI, and defects in an issue tracker.

QA//LAB brings the core lineage into one workspace:

| Problem                                | QA//LAB approach                                             |
| -------------------------------------- | ------------------------------------------------------------ |
| Ambiguous requirements                 | Requirement risk scanning and test-design assistance         |
| Manual test design overhead            | Structured AI-generated test cases                           |
| Failure context gets lost              | Evidence attached directly to execution results              |
| AI conclusions can hallucinate         | Evidence-grounded prompts + normalized output + review state |
| Defects become disconnected from tests | Requirement → test → run → evidence → bug traceability       |
| Access rules are often an afterthought | Workspace roles + project roles + server-side authorization  |

---

## Core Quality Pipeline

### 01 — Requirement Intake & Risk Scan

Paste a requirement, user story, PRD excerpt, or architecture note and ask QA//LAB to inspect its testability.

The risk scan looks for areas such as:

* missing or ambiguous acceptance criteria
* unhandled state transitions
* authentication / authorization gaps
* negative paths and boundary conditions
* concurrency-related risks

The result is intended to help the engineer decide **what should be tested before the test cases are written**.

### 02 — AI Test Designer

Gemini can turn a requirement into structured scenarios containing:

* test ID
* priority
* test type
* preconditions
* action / expected-result steps
* risk assessment
* review state

Generated test cases are saved as **`Needs Review`** and are not treated as authoritative until a human approves them.

### 03 — Interactive Execution

QA engineers can execute a test case step-by-step and mark each step as:

```text
PASS   FAIL   BLOCKED
```

Execution data includes run status, duration, environment, actual results, and attribution.

> **Current scope:** QA//LAB is an execution-tracking and investigation platform rather than a full browser automation engine. Native Playwright execution and CI artifact ingestion are planned roadmap items.

### 04 — Evidence Capture

A failed result can carry diagnostic context such as:

* console output
* network request / response information
* error messages
* stack traces
* execution notes

This keeps the failure and the evidence that explains it together instead of forcing the investigator to reconstruct context later.

### 05 — AI Failure Triage

The investigation layer compares:

* expected behavior
* observed behavior
* supplied evidence
* execution context

The analysis can return:

* failure summary
* probable cause hypothesis
* evidence citations
* calibrated confidence
* next investigation steps
* regression / fix direction

The prompt boundary explicitly treats user-provided content as **data, not instructions**, and the response is normalized to known fields and states. The system is designed to reduce hallucination and prompt-injection risk; it does not claim to eliminate them.

### 06 — Actionable Bug Generation

A reviewed investigation can be converted into a structured defect containing:

* reproduction steps
* preconditions
* observed vs expected behavior
* environment
* assignee
* status
* activity history

This preserves the lineage from the original requirement through the exact failing test and its evidence.

---

## Traceability Model

QA//LAB keeps the major QA entities connected instead of treating them as isolated records:

```text
Project
  ├── Requirements
  │     └── Test Cases
  │            └── Test Runs
  │                   └── Test Results
  │                          ├── Evidence
  │                          ├── AI Failure Analysis
  │                          └── Bug
  └── Access Control
```

### Main entities

| Entity              | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `Project`           | Target system under test                      |
| `Requirement`       | Feature / behavior / acceptance criteria      |
| `TestCase`          | Structured test scenario and steps            |
| `TestRun`           | Execution context and summary metrics         |
| `TestResult`        | Per-test execution outcome                    |
| `Evidence`          | Diagnostic context attached to a result       |
| `AIFailureAnalysis` | AI-assisted investigation output              |
| `Bug`               | Actionable defect record and activity history |

---

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│                   React 19 Client                   │
│  Dashboard · Requirements · Test Design · Runner   │
│  Evidence · Triage · Bugs · Traceability           │
└──────────────────────────┬──────────────────────────┘
                           │ REST /api/*
┌──────────────────────────▼──────────────────────────┐
│                  Express / Node Server              │
│ Auth · Access Control · QA Domain · AI Orchestration│
│ Validation · Rate Limiting · SQLite Persistence    │
└───────────────┬───────────────────────┬─────────────┘
                │                       │
                │                       │ server-side SDK
                │                       ▼
                │              ┌─────────────────┐
                │              │ Gemini / GenAI  │
                │              │ Test Design     │
                │              │ Risk Scan       │
                │              │ Failure Triage  │
                │              └─────────────────┘
                ▼
        ┌──────────────────────┐
        │ SQLite / node:sqlite │
        │ WAL + transactions   │
        └──────────────────────┘
```

### Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion
* **Backend:** Node.js, Express
* **Persistence:** SQLite via Node's built-in `node:sqlite`
* **AI:** Google GenAI SDK (`@google/genai`)
* **Unit / component tests:** Vitest, Testing Library, Node test runner
* **E2E:** Playwright

---

## Security & Trust Model

Security is part of the application model rather than a separate checklist.

### Authentication

* password hashing with `scrypt` and per-user salts
* server-side sessions
* `HttpOnly` + `SameSite=Lax` cookies
* `Secure` cookies in production
* session invalidation on password changes

### Authorization

Two levels of roles are supported.

**Workspace**

```text
admin
member
```

**Project**

```text
owner
editor
viewer
```

Authorization is enforced server-side. Users without project access do not receive a project-existence signal through the API.

### Request hardening

* same-origin protection on write operations
* login rate limiting
* per-user AI rate limiting
* request body size limits
* allow-listed update fields
* enum / shape validation
* JSON error responses
* production CSP
* reverse-proxy support through `TRUST_PROXY`

### AI boundary

* the Gemini API key is read server-side and is never placed in the client bundle
* AI calls have a timeout (`GEMINI_TIMEOUT_MS`)
* prompts instruct the model to cite only supplied evidence
* user content is treated as untrusted data
* generated results are normalized to known enums / states
* generated tests remain `Needs Review` until a human approves them
* when no API key is configured, the application uses clearly labelled fallback behavior instead of inventing analysis

### Data / backups

SQLite data is stored locally by default under `data/qalab.db`.

Admin backup export creates a consistent SQLite snapshot. Backups contain credential hashes and should be treated as sensitive data.

Repository URLs are stored as metadata only; QA//LAB does **not** clone or execute repository content.

---

## Testing Strategy

QA//LAB also tests itself.

The repository contains multiple layers of automated checks:

```text
                 QA//LAB
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Component    Domain/API    E2E
      tests        tests       tests
        │           │           │
        └───────────┼───────────┘
                    ▼
             Regression Safety
```

Coverage areas include:

* authentication and session behavior
* authorization and project isolation
* validation and malformed requests
* AI fallback behavior
* AI response normalization paths
* test-run state transitions
* store / domain logic
* React screen behavior
* browser-level login, permissions, execution, and failure flows

Run the test stack with:

```bash
npm run lint
npm test
npm run test:e2e
```

---

## Demo Walkthrough

QA//LAB ships with a seeded **Core Demo Application** so the workflow can be explored without building a project from scratch.

A typical walkthrough is:

```text
1. Open the dashboard
       ↓
2. Inspect a requirement
       ↓
3. Run the requirement risk scan
       ↓
4. Generate structured test cases
       ↓
5. Execute a test and introduce a failure
       ↓
6. Attach evidence
       ↓
7. Run AI failure analysis
       ↓
8. Generate a formal bug
       ↓
9. Trace the bug back to the test and requirement
```

This makes the repository easier to evaluate as a portfolio project because the intended QA story is visible without additional setup data.

---

## Local Setup

### Requirements

* Node.js **22.13+**
* npm

> QA//LAB uses Node's built-in `node:sqlite`, which Node currently marks as experimental.

### Install

```bash
npm install
```

### Configure environment

Copy the example file:

```bash
cp .env.example .env
```

Gemini is optional:

```env
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
PORT=3000
APP_URL="http://localhost:3000"
```

### Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

On first launch, create the initial account. The first account becomes the workspace admin.

### Production-style local run

```bash
npm run build
NODE_ENV=production npm start
```

Serve it behind HTTPS for production deployments.

### Local single-user shortcut

For local development only:

```bash
AUTH_DISABLED=true npm run dev
```

The server refuses this mode when `NODE_ENV=production`.

---

## Environment Variables

| Variable            | Purpose                        | Default                 |
| ------------------- | ------------------------------ | ----------------------- |
| `GEMINI_API_KEY`    | Gemini API credential          | empty                   |
| `GEMINI_MODEL`      | Gemini model name              | `gemini-2.5-flash`      |
| `PORT`              | HTTP port                      | `3000`                  |
| `APP_URL`           | Application origin             | `http://localhost:3000` |
| `DATA_DIR`          | SQLite storage directory       | `./data`                |
| `ALLOW_SIGNUP`      | Allow open member registration | disabled                |
| `AUTH_DISABLED`     | Local single-user mode         | disabled                |
| `COOKIE_SECURE`     | Force secure cookies           | production              |
| `TRUST_PROXY`       | Trust reverse proxy headers    | disabled                |
| `GEMINI_TIMEOUT_MS` | AI request timeout             | `45000`                 |

---

## Current Limitations

QA//LAB is intentionally scoped as a focused engineering workspace, not a finished enterprise SaaS product.

* single-process Node server
* local SQLite persistence
* no SSO / OAuth / 2FA
* no email service; password reset is admin-issued
* AI features use a fake client in automated tests rather than live-model calls
* UI-level hiding of every viewer-inaccessible write action is still being refined
* accessibility has not yet gone through a full audit
* AI-generated test cases require human review
* automated browser execution, trace capture, and external CI artifact ingestion are not part of the current execution engine

These limitations are deliberate boundaries of the current version and define the next engineering steps rather than hidden behavior.

---

## Roadmap

### Near-term

* [ ] Native Playwright execution engine
* [ ] Screenshot / trace / HAR artifact capture
* [ ] CI ingestion for JUnit, Playwright and similar test result formats
* [ ] Better viewer-mode UI enforcement
* [ ] Full accessibility audit and automated checks

### Quality Intelligence

* [ ] AI evaluation suite for schema compliance, grounding and requirement coverage
* [ ] Flaky-test heuristic engine
* [ ] Regression slicing based on changed areas
* [ ] Historical failure clustering

### Integrations

* [ ] GitHub workflow / webhook integration
* [ ] Jira / Linear synchronization
* [ ] External artifact storage
* [ ] Shared database / session store for horizontally scaled deployments

---

## Portfolio Focus

QA//LAB demonstrates a combination of:

```text
Quality Engineering
        +
Full-stack development
        +
AI-assisted investigation
        +
Security-minded design
        +
Automated testing
```

The project is especially aimed at exploring how AI can support QA work **without removing evidence, traceability, or human review from the loop**.

---

## License

Apache-2.0
