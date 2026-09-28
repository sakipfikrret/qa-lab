# QA//LAB

> AI-assisted Quality Engineering workspace for test design, execution tracking, evidence collection, failure triage, and defect generation.

QA//LAB is a full-stack QA application built around a simple workflow:

```text
Requirement
    ↓
Risk Analysis
    ↓
Test Case Design
    ↓
Manual Execution
    ↓
Evidence
    ↓
Failure Analysis
    ↓
Bug Report
```

The project explores how an LLM can assist software testing without treating model output as automatically trusted or production-ready.

---

## What It Does

QA//LAB connects requirements, test cases, execution results, evidence, AI analysis, and bugs in one workspace.

### Requirement Analysis

Requirements can be submitted as structured or natural-language input. The system can analyze them for potential quality risks such as:

* missing acceptance criteria
* unclear state transitions
* security-related concerns
* negative and edge cases
* concurrency-related risks

### AI Test Design

The AI layer can generate structured test cases from requirements.

Generated test cases include:

* test ID
* title and description
* priority
* test type
* preconditions
* execution steps
* expected result
* risk information
* tags
* AI notes

AI-generated cases are stored as `Needs Review` rather than being treated as automatically approved tests.

### Test Execution

Test cases can be executed step by step with:

```text
PASS
FAIL
BLOCKED
```

Execution data includes actual results, errors, notes, and evidence associated with failed steps.

### Evidence Collection

Failed test steps can contain diagnostic evidence such as:

* browser console output
* HTTP request/response data
* stack traces
* error messages
* execution notes

### AI Failure Triage

A failed test can be analyzed using its expected result, actual result, evidence, and execution context.

The AI response is structured around:

```text
Failure Summary
Probable Cause
Evidence / Citations
Confidence
Next Investigation Steps
Regression Risk
Suggested Fix Direction
```

The analysis is treated as an investigation aid, not a verified root-cause determination.

### Bug Generation

Failure analysis can be converted into a structured bug report containing reproduction details, environment information, severity, ownership, and activity history.

---

## Architecture

```text
┌───────────────────────────────────────────────┐
│                  React Client                 │
│                                               │
│ Dashboard · Requirements · Test Designer      │
│ Test Runner · Failure Triage · Bugs           │
└───────────────────────┬───────────────────────┘
                        │
                     REST API
                        │
┌───────────────────────▼───────────────────────┐
│                 Express Server                │
│                                               │
│ Auth · Authorization · QA Logic               │
│ AI Prompt Layer · Persistence · Validation    │
└───────────────┬───────────────────┬───────────┘
                │                   │
                │                   │
          SQLite Storage       Google GenAI
                              (optional AI layer)
```

### Stack

| Layer     | Technology                |
| --------- | ------------------------- |
| Frontend  | React 19 + TypeScript     |
| Build     | Vite                      |
| Styling   | Tailwind CSS              |
| Icons     | Lucide React              |
| Backend   | Express                   |
| Runtime   | Node.js 22.13+            |
| Database  | SQLite via `node:sqlite`  |
| AI        | Google GenAI SDK / Gemini |
| Testing   | Vitest + Node test runner |
| Animation | Motion                    |

---

## Domain Model

The application keeps explicit relationships between the main QA entities:

```text
Project
   │
   ├── Requirements
   │       │
   │       └── Test Cases
   │                │
   │                └── Test Results
   │                         │
   │                         ├── Evidence
   │                         ├── AI Failure Analysis
   │                         └── Bug
   │
   └── Test Runs
```

The main entities are:

### Project

Represents the application or system being tested.

### Requirement

Contains the requirement definition, priority, risks, and acceptance criteria.

### Test Case

Contains structured test information, preconditions, execution steps, expected results, and status.

### Test Run

Represents an execution session and its environment.

### Test Result

Stores step-level execution status, actual results, and errors.

### Evidence

Stores diagnostic information associated with failed execution steps.

### AI Failure Analysis

Stores the model's structured investigation result, including confidence and suggested next steps.

### Bug

Represents a formal defect generated from an investigation.

---

## AI Reliability Approach

The project intentionally treats LLM output as untrusted input.

Some of the safeguards implemented in the application include:

### Server-side API key handling

The Gemini API key is only read on the server.

```text
Client
  ✕ GEMINI_API_KEY

Server
  ✓ GEMINI_API_KEY
```

### Structured output normalization

Model responses are normalized against known application enums instead of being inserted directly into the data model.

Examples include:

```text
Priority
Test Type
Bug Severity
Bug Status
Confidence
Test Case Status
```

### Human review

AI-generated test cases are stored as:

```text
Needs Review
```

before they can be treated as approved test cases.

### Evidence grounding

The failure-analysis prompt explicitly treats supplied logs, JSON, and user-provided evidence as data to analyze rather than instructions to follow.

### Safe fallback

When the AI provider is unavailable or returns an unusable response, the application falls back to deterministic behavior instead of assuming that the model succeeded.

These controls reduce common failure modes, but they do not eliminate hallucination, prompt injection, or incorrect model reasoning.

---

## Security

QA//LAB includes several application-level security controls:

* password hashing with `scrypt` and per-user salts
* server-side sessions
* `HttpOnly` cookies
* `SameSite=Lax`
* `Secure` cookies in production
* role-based authorization
* same-origin protection for write requests
* login rate limiting
* per-user AI rate limiting
* request body size limits
* allow-listed update fields
* enum validation
* security-related response headers
* server-only AI credentials

Repository URLs are stored as metadata only. The application does not clone or execute repository contents.

---

## Project Structure

```text
qa-lab/
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   └── types/
│
├── server/
│   ├── auth.ts
│   └── db.ts
│
├── tests/
│   ├── server.test.ts
│   ├── store.test.ts
│   ├── logic.test.ts
│   └── qa-engine.test.ts
│
├── server.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── .env.example
```

---

## Getting Started

### Requirements

* Node.js `22.13+`
* npm

The project uses Node's built-in `node:sqlite` API.

### Installation

```bash
git clone <your-repository-url>
cd qa-lab
npm install
```

### Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Add a Gemini API key to enable the AI features:

```env
GEMINI_API_KEY=your_api_key
```

The model can optionally be changed with:

```env
GEMINI_MODEL=gemini-2.5-flash
```

Without an API key, AI-dependent flows use the application's fallback behavior instead of exposing credentials to the client.

### Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Run type checking

```bash
npm run lint
```

### Run tests

```bash
npm test
```

### Production build

```bash
npm run build
NODE_ENV=production npm start
```

---

## Demo Workflow

The project includes a seeded demo workspace so the main QA flow can be explored without building a project from scratch.

A typical walkthrough looks like this:

```text
1. Open a project
2. Inspect a requirement
3. Generate test cases
4. Review generated cases
5. Start a test run
6. Mark a step as FAIL
7. Add diagnostic evidence
8. Run AI failure analysis
9. Review the generated investigation
10. Create a bug report
```

The demo dataset is synthetic and is included only to demonstrate the application workflow.

---

## Testing

The repository contains tests covering application logic, persistence, QA workflows, and server behavior.

Areas covered include:

```text
Authentication
Authorization
Session handling
Request validation
QA state transitions
Persistence
AI response parsing
AI fallback behavior
Enum normalization
Failure analysis flows
```

AI-related tests use controlled test seams/fake clients rather than requiring a live Gemini request for every test.

---

## Current Limitations

QA//LAB is intentionally a portfolio-scale project rather than a production-scale test infrastructure.

Current limitations include:

* browser tests are not executed by the application itself
* no Playwright or Cypress execution pipeline yet
* no CI/JUnit result ingestion yet
* AI responses are advisory and still require human review
* SQLite is suitable for the current single-process architecture, not horizontal scaling
* all authenticated users currently share the same workspace
* no password reset or email verification flow
* live Gemini API behavior is not exercised as part of CI

The current execution model focuses on **test management and execution tracking**, rather than replacing browser automation frameworks.

---

## Roadmap

Potential next steps:

### Automated Test Execution

Integrate Playwright or Cypress so test cases can be executed automatically instead of being manually marked.

### CI Result Ingestion

Import results from:

```text
JUnit XML
Playwright JSON
Cypress results
```

and connect them to existing test cases and requirements.

### AI Regression Analysis

Use code changes and historical test data to suggest which tests should be re-run after a change.

### Flaky Test Detection

Analyze historical execution times and outcomes to identify potentially flaky tests.

### Issue Tracker Integration

Connect generated bugs with platforms such as Jira or Linear.

### AI Evaluation Layer

Add a dedicated test suite for evaluating AI behavior itself, including:

```text
Schema compliance
Unsupported claims
Evidence grounding
Prompt injection resistance
Regression consistency
```

---

## Why I Built It

QA tooling often sits between two
