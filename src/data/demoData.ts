import { Project, Requirement, TestCase, TestRun, Bug, QAInsight, Evidence, AIFailureAnalysis } from '../types/qa';

export const DEMO_PROJECT: Project = {
  id: 'proj-demo-01',
  name: 'QA//LAB Core Demo Application',
  description: 'Enterprise workspace collaboration and billing platform with multi-tenant auth, role-based access, and webhooks.',
  type: 'Web Application',
  targetUrl: 'https://staging.qa-lab-workspace.internal',
  repoUrl: 'https://github.com/qalab-org/demo-workspace-app',
  techStack: ['TypeScript', 'Next.js 15', 'Express', 'PostgreSQL', 'Redis', 'TailwindCSS'],
  rawRequirements: `1. Authentication & Security: Users must register with work email and high-entropy password. Multi-factor authentication required for admin roles. Concurrent sessions capped at 3 per user.
2. User Profile: Authenticated users can modify display name, avatar URL, and timezone. Email modification requires re-verification token.
3. Password Reset: Initiates time-bound (15-minute) signed token. Token must be single-use and invalidated immediately upon credential update.
4. Billing & Subscriptions: Workspace owners can upgrade tiers via Stripe webhook integration. Downgrades must gracefully lock premium seat capacity without deleting historical audit logs.`,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-27T08:00:00Z',
  isDemo: true,
};

export const DEMO_REQUIREMENTS: Requirement[] = [
  {
    id: 'req-01',
    projectId: 'proj-demo-01',
    code: 'REQ-AUTH-001',
    title: 'Work Email & Multi-Tenant Authentication',
    content: 'Users can register and authenticate using corporate work email with bcrypt/argon2 hashing. Supports SSO and session token issuance.',
    type: 'Security',
    priority: 'Critical',
    risks: [
      {
        id: 'risk-01',
        risk: 'Brute-force attack vulnerability without rate limiting',
        severity: 'High',
        evidence: 'No rate limiting specified on /api/v1/auth/login endpoint in the spec',
        recommendation: 'Implement sliding window rate limiting (5 attempts per IP / email per minute) with CAPTCHA fallback.',
      },
      {
        id: 'risk-02',
        risk: 'Session persistence across password reset',
        severity: 'Critical',
        evidence: 'Specification does not detail global token revocation upon credential change',
        recommendation: 'Explicitly enforce JWT blacklist or increment user token_version on password change.',
      }
    ],
    testCaseCount: 3,
  },
  {
    id: 'req-02',
    projectId: 'proj-demo-01',
    code: 'REQ-AUTH-002',
    title: 'Concurrent Session Management & Device Invalidation',
    content: 'Users are permitted a maximum of 3 concurrent active sessions. Logging in on a 4th device must automatically terminate or prompt revocation of the oldest session.',
    type: 'Security',
    priority: 'High',
    risks: [
      {
        id: 'risk-03',
        risk: 'Race condition on concurrent logins from distributed clients',
        severity: 'High',
        evidence: 'Distributed lock mechanism not specified for session table insertion',
        recommendation: 'Use atomic Redis lease or database transaction with SERIALIZABLE isolation to enforce count ceiling.',
      }
    ],
    testCaseCount: 2,
  },
  {
    id: 'req-03',
    projectId: 'proj-demo-01',
    code: 'REQ-PROF-001',
    title: 'User Profile & Identity Updates',
    content: 'Authenticated users can update their profile information including display name, avatar, and notification preferences.',
    type: 'Functional',
    priority: 'Medium',
    risks: [
      {
        id: 'risk-04',
        risk: 'Stored XSS via display name or malicious avatar URL',
        severity: 'High',
        evidence: 'No input sanitization or URL scheme validation mentioned',
        recommendation: 'Enforce strict schema validation (allow only https: image URLs) and sanitize user display names.',
      }
    ],
    testCaseCount: 2,
  },
  {
    id: 'req-04',
    projectId: 'proj-demo-01',
    code: 'REQ-BILL-001',
    title: 'Subscription Tier Transition & Graceful Seat Locking',
    content: 'Workspace owners can upgrade or downgrade seat plans. Downgrades take effect at end of billing cycle and freeze seats exceeding limit without deleting records.',
    type: 'Business',
    priority: 'Critical',
    risks: [
      {
        id: 'risk-05',
        risk: 'Data loss or permission lockouts for active team members during downgrade',
        severity: 'Critical',
        evidence: 'Undefined behavior when seats exceed tier limit at renewal moment',
        recommendation: 'Specify deterministic seat deactivation rule (e.g. prompt owner to choose, or freeze newest members into read-only mode).',
      }
    ],
    testCaseCount: 2,
  },
];

export const DEMO_TEST_CASES: TestCase[] = [
  {
    id: 'tc-01',
    projectId: 'proj-demo-01',
    requirementId: 'req-01',
    code: 'TC-AUTH-001',
    title: 'Standard Work Email Login with Valid Credentials',
    description: 'Verify that an active user with valid corporate email and password receives a signed session token and is redirected to their workspace.',
    priority: 'Critical',
    type: 'Functional',
    preconditions: [
      'User account exists in PostgreSQL with status ACTIVE',
      'User has at least one associated workspace organization',
    ],
    steps: [
      { stepNumber: 1, action: 'Navigate to /login on staging environment', expected: 'Login screen renders with Email and Password inputs and SSO buttons' },
      { stepNumber: 2, action: 'Enter "alex.dev@acme-corp.io" into Email field', expected: 'Field accepts email and performs client-side syntax validation' },
      { stepNumber: 3, action: 'Enter valid secret into Password field', expected: 'Characters are masked' },
      { stepNumber: 4, action: 'Click "Sign In" button', expected: 'Button enters loading state, POST /api/v1/auth/login returns 200 with JWT cookie' },
      { stepNumber: 5, action: 'Observe application routing', expected: 'Redirects to /dashboard with user session populated in header' }
    ],
    expectedResult: 'User is authenticated, session cookie set with HttpOnly and SameSite=Lax flags, workspace loaded.',
    risk: 'Authentication gateway failure halts entire user entry.',
    tags: ['auth', 'smoke', 'p0', 'core'],
    status: 'Approved',
    aiNotes: 'Core happy-path validation. Ensure cookie security attributes (HttpOnly, Secure) are checked in response headers.',
    createdAt: '2026-09-21T11:00:00Z',
    updatedAt: '2026-09-22T09:30:00Z',
  },
  {
    id: 'tc-02',
    projectId: 'proj-demo-01',
    requirementId: 'req-02',
    code: 'TC-AUTH-002',
    title: 'Concurrent Session Limit Invalidation (4th Device Eviction)',
    description: 'Verify system behavior when an account already active on 3 concurrent devices attempts authentication from a 4th client.',
    priority: 'High',
    type: 'Security',
    preconditions: [
      'User "sarah.qa@acme-corp.io" has 3 active session tokens recorded in Redis session registry',
      'Timestamps for active sessions are t0 (mobile), t1 (desktop-chrome), t2 (laptop-firefox)'
    ],
    steps: [
      { stepNumber: 1, action: 'Open incognito browser representing Device 4', expected: 'Clean session storage and cookies' },
      { stepNumber: 2, action: 'Authenticate with sarah.qa credentials', expected: 'Auth completes; backend detects 3 existing active sessions' },
      { stepNumber: 3, action: 'Inspect Redis session registry and oldest session t0', expected: 'Oldest session t0 (mobile) is revoked; new session t3 is granted' },
      { stepNumber: 4, action: 'Attempt API query on Device 1 (t0)', expected: 'Returns 401 Unauthorized with code "SESSION_EVICTED_CONCURRENT_LIMIT"' }
    ],
    expectedResult: 'Oldest session is cleanly revoked without server deadlock. Max 3 active sessions maintained.',
    risk: 'Deadlock in Redis distributed lock or unauthorized session proliferation.',
    tags: ['auth', 'security', 'redis', 'concurrency'],
    status: 'Approved',
    aiNotes: 'High-risk concurrency boundary. Watch for race conditions during simultaneous 4th and 5th login attempts.',
    createdAt: '2026-09-21T11:30:00Z',
    updatedAt: '2026-09-23T14:15:00Z',
  },
  {
    id: 'tc-03',
    projectId: 'proj-demo-01',
    requirementId: 'req-01',
    code: 'TC-AUTH-003',
    title: 'Password Reset Token Invalidation Post-Update',
    description: 'Verify that once a password reset token is used, reusing the same token link yields 400 Expired / Invalid.',
    priority: 'Critical',
    type: 'Security',
    preconditions: [
      'A valid password reset request was triggered for "dev@target.io"',
      'Raw reset token generated with 15-minute TTL'
    ],
    steps: [
      { stepNumber: 1, action: 'Visit /reset-password?token=valid_token_xyz', expected: 'Reset password form is displayed with password confirmation' },
      { stepNumber: 2, action: 'Submit new compliant password "NewSecurePass#2026!"', expected: 'Password updated, confirmation toast displayed, redirected to login' },
      { stepNumber: 3, action: 'Immediately navigate back to /reset-password?token=valid_token_xyz in second tab', expected: 'Page displays error "Reset link has expired or already been used"' },
      { stepNumber: 4, action: 'Attempt POST /api/v1/auth/reset-password with original token directly', expected: 'API returns HTTP 400 Bad Request with errorCode: TOKEN_ALREADY_CONSUMED' }
    ],
    expectedResult: 'Token is immediately invalidated upon first successful submission. Replay attacks are blocked.',
    risk: 'Account takeover if password reset link can be replayed within the 15-minute window.',
    tags: ['auth', 'security', 'p0', 'replay-attack'],
    status: 'Approved',
    createdAt: '2026-09-22T08:00:00Z',
    updatedAt: '2026-09-24T10:00:00Z',
  },
  {
    id: 'tc-04',
    projectId: 'proj-demo-01',
    requirementId: 'req-03',
    code: 'TC-PROF-001',
    title: 'Profile Avatar Update with SVG Vector Payload',
    description: 'Verify system sanitization when a user updates their profile avatar with an SVG containing embedded script tags.',
    priority: 'High',
    type: 'Negative Test',
    preconditions: [
      'User is logged in on profile settings page',
    ],
    steps: [
      { stepNumber: 1, action: 'Navigate to /settings/profile', expected: 'Profile form loads with existing user data' },
      { stepNumber: 2, action: 'Upload avatar file "malicious_exploit.svg" containing <script>alert(document.cookie)</script>', expected: 'Client or server rejects SVG or strips script payload via DOMPurify' },
      { stepNumber: 3, action: 'Inspect rendered avatar in DOM or CDN response', expected: 'No inline script executed; Content-Type served as image/svg+xml with CSP sandbox or rasterized to WebP' }
    ],
    expectedResult: 'Malicious script payloads in uploaded avatars are completely neutralized.',
    risk: 'Stored Cross-Site Scripting (XSS) allowing session hijacking across team members viewing profile.',
    tags: ['xss', 'security', 'profile', 'file-upload'],
    status: 'Approved',
    createdAt: '2026-09-22T14:00:00Z',
    updatedAt: '2026-09-25T11:00:00Z',
  },
  {
    id: 'tc-05',
    projectId: 'proj-demo-01',
    requirementId: 'req-04',
    code: 'TC-BILL-001',
    title: 'Tier Downgrade Beyond Active Seat Capacity (Boundary Test)',
    description: 'Verify system behavior when workspace owner with 18 active members downgrades to 10-seat Starter tier.',
    priority: 'Critical',
    type: 'Edge Case',
    preconditions: [
      'Workspace currently on Enterprise tier with 18 active users',
      'Owner initiates downgrade to Starter (10 seats max) at billing cycle end'
    ],
    steps: [
      { stepNumber: 1, action: 'Select Starter Plan in Billing modal and confirm downgrade', expected: 'System prompts modal: "Select 8 members to switch to Read-Only seats or manage assignments"' },
      { stepNumber: 2, action: 'Submit downgrade schedule without selecting deactivations', expected: 'Validation prevents blind downgrade without designated seat mapping' },
      { stepNumber: 3, action: 'Check database audit logs for workspace changes', expected: 'No user records deleted; downgrade scheduled timestamp recorded' }
    ],
    expectedResult: 'System gracefully handles seat overhang with explicit user confirmation and zero data destruction.',
    risk: 'Accidental lockout or catastrophic deletion of team members upon plan adjustment.',
    tags: ['billing', 'stripe', 'edge-case', 'rbac'],
    status: 'Approved',
    createdAt: '2026-09-23T09:00:00Z',
    updatedAt: '2026-09-25T16:00:00Z',
  },
];

export const DEMO_EVIDENCE: Evidence[] = [
  {
    id: 'ev-01',
    testResultId: 'res-run01-tc02',
    type: 'error_message',
    title: 'Redis Distributed Lock Timeout Exception',
    content: `UnhandledPromiseRejection: RedisLeaseLockConflict: Key "session:lock:user_sarah_qa" lease lock held by worker pid:4102. Transaction timed out after 3000ms.
    at RedisLock.acquireOrWait (/workspace/backend/src/services/sessionLock.ts:84:13)
    at SessionService.evictOldestSession (/workspace/backend/src/services/sessionService.ts:142:24)
    at SessionService.createSession (/workspace/backend/src/services/sessionService.ts:67:11)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
    timestamp: '2026-09-26T14:32:18Z',
  },
  {
    id: 'ev-02',
    testResultId: 'res-run01-tc02',
    type: 'network_log',
    title: 'HTTP POST /api/v1/auth/login 500 Response Payload',
    content: `REQUEST:
POST /api/v1/auth/login HTTP/1.1
Host: staging.qa-lab-workspace.internal
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
Content-Type: application/json
Origin: https://staging.qa-lab-workspace.internal

{"email":"sarah.qa@acme-corp.io","password":"[REDACTED]","clientId":"dev-04-incognito"}

RESPONSE:
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 178
Connection: close
Date: Sun, 26 Sep 2026 14:32:21 GMT

{
  "status": 500,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "RedisLeaseLockConflict: Key session:lock:user_sarah_qa lease lock held by worker pid:4102.",
  "requestId": "req_88a91bc7df"
}`,
    timestamp: '2026-09-26T14:32:21Z',
  },
  {
    id: 'ev-03',
    testResultId: 'res-run01-tc02',
    type: 'console_log',
    title: 'Browser Console Uncaught Promise Rejection',
    content: `[14:32:19.402] [POST] https://staging.qa-lab-workspace.internal/api/v1/auth/login -> pending (waiting 3012ms)
[14:32:22.415] [POST] https://staging.qa-lab-workspace.internal/api/v1/auth/login -> 500 Internal Server Error
[14:32:22.420] Uncaught (in promise) AxiosError: Request failed with status code 500
    at createError (axios.js:124)
    at settle (axios.js:180)
    at XMLHttpRequest.handleLoad (axios.js:77)
[14:32:22.422] [AuthContext] Login failed: Unknown server exception req_88a91bc7df. UI stuck in spinning state.`,
    timestamp: '2026-09-26T14:32:22Z',
  },
];

export const DEMO_AI_FAILURE_ANALYSIS: AIFailureAnalysis = {
  id: 'ana-01',
  failureSummary: 'Deadlock in Redis session lease lock during concurrent session eviction leads to unhandled HTTP 500',
  probableCause: 'When a 4th device authenticates, `SessionService.evictOldestSession` attempts to acquire `session:lock:user_sarah_qa` with a 3000ms timeout. A previous unhandled promise in `sessionLock.ts` did not release the Redis key mutex in a `finally` block, causing subsequent lock requests to deadlock and crash the HTTP worker.',
  evidenceSupported: [
    'Evidence #1: RedisLeaseLockConflict stack trace pointing directly to sessionLock.ts:84 and sessionService.ts:142',
    'Evidence #2: HTTP 500 JSON response confirming the unhandled exception was leaked to client rather than translated to a structured status',
    'Evidence #3: Browser console trace showing UI infinite spin on unhandled 500 error code',
  ],
  confidence: 'High',
  suggestedInvestigation: [
    '1. Inspect backend `sessionLock.ts` to verify mutex releases occur in a try/finally block so keys are freed even on exception.',
    '2. Check Redis TTL configuration on lease keys (ensure keys have auto-expire fallback TTL of 5000ms to prevent permanent deadlocks).',
    '3. Verify if connection pooling on Redis cluster worker pid:4102 exhausted its client limit.',
    '4. Add an application-level error handler so Redis lock contention returns a clean 429 or 503 instead of an unhandled 500.',
  ],
  regressionRisk: 'High - Affects all enterprise users logging into mobile + tablet + desktop environments simultaneously.',
  recommendedFixDirection: 'Wrap Redis mutex acquisition in a `try...finally` block that guarantees `redis.del(lockKey)` or lua unlock script execution, and add an exponential backoff retry mechanism (3 attempts @ 150ms).',
  analyzedAt: '2026-09-26T14:35:00Z',
  isRealAI: false, // pre-generated demo baseline, but users can re-run live with Gemini
};

export const DEMO_TEST_RUNS: TestRun[] = [
  {
    id: 'run-01',
    runId: 'RUN-2026-03-01',
    projectId: 'proj-demo-01',
    name: 'Sprint 42 Staging Regression Suite',
    environment: 'Staging',
    startTime: '2026-09-26T14:28:00Z',
    endTime: '2026-09-26T14:35:00Z',
    duration: '7m 00s',
    status: 'Failed',
    testCaseIds: ['tc-01', 'tc-02', 'tc-03', 'tc-04', 'tc-05'],
    results: {
      'tc-01': {
        id: 'res-run01-tc01',
        testRunId: 'run-01',
        testCaseId: 'tc-01',
        status: 'Passed',
        executedAt: '2026-09-26T14:29:10Z',
        executedBy: 'Automated Runner (CI/CD)',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'PASS' },
          { stepNumber: 3, status: 'PASS' },
          { stepNumber: 4, status: 'PASS' },
          { stepNumber: 5, status: 'PASS' },
        ],
        actualResult: 'User authenticated in 184ms, session cookie correctly set with HttpOnly and SameSite=Lax flags.',
        evidenceIds: [],
      },
      'tc-02': {
        id: 'res-run01-tc02',
        testRunId: 'run-01',
        testCaseId: 'tc-02',
        status: 'Failed',
        executedAt: '2026-09-26T14:32:25Z',
        executedBy: 'Manual QA Engineer (Alex Chen)',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'FAIL', actualNotes: 'POST /api/v1/auth/login failed with HTTP 500' },
          { stepNumber: 3, status: 'BLOCKED', actualNotes: 'Blocked by failure on step 2' },
          { stepNumber: 4, status: 'BLOCKED', actualNotes: 'Blocked by failure on step 2' },
        ],
        actualResult: 'Server crashed with HTTP 500 when 4th concurrent device attempted authentication. Redis lease lock deadlock.',
        errorMessage: 'RedisLeaseLockConflict: Key session:lock:user_sarah_qa lease lock held by worker pid:4102. Transaction timed out after 3000ms.',
        notes: 'Reproduced reliably on staging cluster with 3 existing sessions.',
        evidenceIds: ['ev-01', 'ev-02', 'ev-03'],
        evidenceList: DEMO_EVIDENCE,
        bugId: 'bug-01',
        aiAnalysis: DEMO_AI_FAILURE_ANALYSIS,
      },
      'tc-03': {
        id: 'res-run01-tc03',
        testRunId: 'run-01',
        testCaseId: 'tc-03',
        status: 'Passed',
        executedAt: '2026-09-26T14:33:10Z',
        executedBy: 'Automated Runner (CI/CD)',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'PASS' },
          { stepNumber: 3, status: 'PASS' },
          { stepNumber: 4, status: 'PASS' },
        ],
        actualResult: 'Replay request returned HTTP 400 with TOKEN_ALREADY_CONSUMED as expected.',
        evidenceIds: [],
      },
      'tc-04': {
        id: 'res-run01-tc04',
        testRunId: 'run-01',
        testCaseId: 'tc-04',
        status: 'Passed',
        executedAt: '2026-09-26T14:34:02Z',
        executedBy: 'Security Audit Script',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'PASS' },
          { stepNumber: 3, status: 'PASS' },
        ],
        actualResult: 'SVG avatar stripped with DOMPurify; script element neutralized.',
        evidenceIds: [],
      },
      'tc-05': {
        id: 'res-run01-tc05',
        testRunId: 'run-01',
        testCaseId: 'tc-05',
        status: 'Blocked',
        executedAt: '2026-09-26T14:34:45Z',
        executedBy: 'Manual QA Engineer (Alex Chen)',
        stepResults: [
          { stepNumber: 1, status: 'BLOCKED', actualNotes: 'Stripe test webhook endpoint returned 503 Service Unavailable on staging' },
        ],
        actualResult: 'Stripe mock environment unreachable during run execution.',
        errorMessage: 'StripeTestWebhookConnectionTimeout: Failed to connect to port 12111',
        evidenceIds: [],
      },
    },
    summary: {
      total: 5,
      passed: 3,
      failed: 1,
      blocked: 1,
      skipped: 0,
      notExecuted: 0,
      passRate: 60,
    }
  },
  {
    id: 'run-02',
    runId: 'RUN-2026-03-02',
    projectId: 'proj-demo-01',
    name: 'Preview Release v2.4.0 Smoke Verification',
    environment: 'Preview',
    startTime: '2026-09-27T06:10:00Z',
    endTime: '2026-09-27T06:14:15Z',
    duration: '4m 15s',
    status: 'Passed',
    testCaseIds: ['tc-01', 'tc-03', 'tc-04'],
    results: {
      'tc-01': {
        id: 'res-run02-tc01',
        testRunId: 'run-02',
        testCaseId: 'tc-01',
        status: 'Passed',
        executedAt: '2026-09-27T06:11:00Z',
        executedBy: 'GitHub Actions Bot',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'PASS' },
          { stepNumber: 3, status: 'PASS' },
          { stepNumber: 4, status: 'PASS' },
          { stepNumber: 5, status: 'PASS' },
        ],
        actualResult: 'Login successful on preview deployment. All security headers verified.',
        evidenceIds: [],
      },
      'tc-03': {
        id: 'res-run02-tc03',
        testRunId: 'run-02',
        testCaseId: 'tc-03',
        status: 'Passed',
        executedAt: '2026-09-27T06:12:30Z',
        executedBy: 'GitHub Actions Bot',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'PASS' },
          { stepNumber: 3, status: 'PASS' },
          { stepNumber: 4, status: 'PASS' },
        ],
        actualResult: 'Password reset single-use token verified.',
        evidenceIds: [],
      },
      'tc-04': {
        id: 'res-run02-tc04',
        testRunId: 'run-02',
        testCaseId: 'tc-04',
        status: 'Passed',
        executedAt: '2026-09-27T06:13:45Z',
        executedBy: 'GitHub Actions Bot',
        stepResults: [
          { stepNumber: 1, status: 'PASS' },
          { stepNumber: 2, status: 'PASS' },
          { stepNumber: 3, status: 'PASS' },
        ],
        actualResult: 'Avatar upload sanitization confirmed.',
        evidenceIds: [],
      },
    },
    summary: {
      total: 3,
      passed: 3,
      failed: 0,
      blocked: 0,
      skipped: 0,
      notExecuted: 0,
      passRate: 100,
    }
  }
];

export const DEMO_BUGS: Bug[] = [
  {
    id: 'bug-01',
    bugId: 'BUG-101',
    projectId: 'proj-demo-01',
    testRunId: 'run-01',
    testResultId: 'res-run01-tc02',
    testCaseId: 'tc-02',
    title: 'Concurrent session limit triggers Redis lease deadlock and unhandled 500 error',
    severity: 'Critical',
    priority: 'Critical',
    status: 'In Progress',
    environment: 'Staging (v2.4.0-rc2)',
    preconditions: 'Target user account already possesses 3 active sessions in Redis registry.',
    stepsToReproduce: [
      '1. Create 3 active sessions across distinct client instances for user account.',
      '2. Launch 4th client instance in an incognito window.',
      '3. Submit valid credentials via POST /api/v1/auth/login.',
      '4. Observe server response and backend log stream.'
    ],
    expectedBehavior: 'Backend should evict the oldest session gracefully and issue credentials for the 4th device, or return 409 Conflict with session selection options.',
    actualBehavior: 'Backend hangs for 3000ms until RedisLeaseLockConflict timeout triggers, returning HTTP 500 Internal Server Error with unhandled stack trace.',
    evidenceNotes: 'Supplied with 3 pieces of verified evidence: Redis lock exception trace, raw HTTP 500 response payload, and browser console Axios rejection.',
    probableCause: 'Redis mutex in `sessionLock.ts` is not released in a finally block when an eviction routine errors, causing permanent lock contention.',
    regressionRisk: 'Affects any user operating across mobile and desktop apps simultaneously.',
    suggestedFixDirection: 'Implement `try { ... } finally { await redisLock.release() }` in `sessionService.ts` and set a 5-second automatic TTL on lock acquisition.',
    assignedTo: 'Marcus Vance (Backend Lead)',
    source: 'Test Run RUN-2026-03-01 / TC-AUTH-002',
    createdAt: '2026-09-26T14:40:00Z',
    updatedAt: '2026-09-26T16:15:00Z',
    history: [
      {
        timestamp: '2026-09-26T14:40:00Z',
        action: 'Bug Created via AI Investigation Pipeline',
        actor: 'QA//LAB Failure Analyzer',
        note: 'Synthesized from test result res-run01-tc02 with high confidence rating.'
      },
      {
        timestamp: '2026-09-26T15:00:00Z',
        action: 'Status changed to In Progress',
        actor: 'Marcus Vance',
        note: 'Reproduced in local docker-compose environment. Patching sessionLock.ts.'
      }
    ]
  },
  {
    id: 'bug-02',
    bugId: 'BUG-102',
    projectId: 'proj-demo-01',
    title: 'Stripe webhook 503 leaves workspace downgrade status in unconfirmed pending state',
    severity: 'Major',
    priority: 'High',
    status: 'Open',
    environment: 'Staging',
    preconditions: 'Workspace owner downgrades tier with network disruption between Stripe and webhook listener.',
    stepsToReproduce: [
      '1. Initiate downgrade from Enterprise to Starter tier.',
      '2. Simulate 503 response on /api/v1/webhooks/stripe.',
      '3. Query workspace database record status field.'
    ],
    expectedBehavior: 'Webhook listener schedules automatic retry with exponential backoff and sets status to "DOWNGRADE_PENDING_CONFIRMATION".',
    actualBehavior: 'Workspace enters corrupted state where UI displays Starter tier features but database retains Enterprise billable seat count.',
    evidenceNotes: 'Observed during TC-BILL-001 boundary execution.',
    probableCause: 'Webhook idempotency handler does not record pending transactional state before processing payload.',
    regressionRisk: 'Billing discrepancy causing overcharges or undercharges.',
    suggestedFixDirection: 'Store incoming raw webhook events in an outbox queue table before execution and rely on background worker for reconciliation.',
    assignedTo: 'Unassigned',
    source: 'Test Run RUN-2026-03-01 / TC-BILL-001',
    createdAt: '2026-09-26T15:20:00Z',
    updatedAt: '2026-09-26T15:20:00Z',
    history: [
      {
        timestamp: '2026-09-26T15:20:00Z',
        action: 'Bug Logged',
        actor: 'Alex Chen (QA)',
      }
    ]
  }
];

export const DEMO_INSIGHTS: QAInsight[] = [
  {
    id: 'ins-01',
    projectId: 'proj-demo-01',
    title: 'Ambiguous Session Eviction Policy under Concurrent Logins',
    severity: 'High',
    category: 'Ambiguity',
    description: 'The requirement REQ-AUTH-002 stipulates a 3-session ceiling, but fails to define whether the user is prompted to choose which device to disconnect or if the oldest device is terminated silently without warning.',
    recommendation: 'Specify whether revocation is silent FIFO or if the client UI receives an interactive device selector dialog (e.g. Slack/Telegram model).',
    createdAt: '2026-09-26T12:00:00Z',
  },
  {
    id: 'ins-02',
    projectId: 'proj-demo-01',
    title: 'Missing Re-Authentication Requirement for High-Value Billing Changes',
    severity: 'Critical',
    category: 'Security Risk',
    description: 'Downgrades and credit card modifications do not require password re-entry or 2FA step-up authentication. A compromised session could execute destructive billing changes.',
    recommendation: 'Enforce step-up authentication (sudo mode) requiring password confirmation within 5 minutes prior to accessing billing downgrade handlers.',
    createdAt: '2026-09-26T12:15:00Z',
  },
  {
    id: 'ins-03',
    projectId: 'proj-demo-01',
    title: 'Undefined Behavior on Downgrade with Over-Quota Active Seats',
    severity: 'High',
    category: 'Missing Requirement',
    description: 'No business logic defines which 8 users lose access when a 18-member workspace downgrades to a 10-seat Starter tier.',
    recommendation: 'Add explicit requirement requiring owner to designate active vs read-only members prior to invoice cycle finalization.',
    createdAt: '2026-09-26T12:30:00Z',
  },
];
