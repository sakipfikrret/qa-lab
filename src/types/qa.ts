export type ProjectType = 'Web Application' | 'API' | 'Mobile Application' | 'Software Project' | 'Custom';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TestType = 
  | 'Functional'
  | 'Regression'
  | 'Security'
  | 'Performance'
  | 'Usability'
  | 'Edge Case'
  | 'Negative Test';

export type TestCaseStatus = 'Draft' | 'Approved' | 'Needs Review' | 'Rejected';

export type TestRunStatus = 'Passed' | 'Failed' | 'Blocked' | 'Skipped' | 'In Progress';

export type TestResultStatus = 'Passed' | 'Failed' | 'Blocked' | 'Skipped' | 'Not Executed';

export type StepStatus = 'PENDING' | 'PASS' | 'FAIL' | 'BLOCKED';

export type BugSeverity = 'Blocker' | 'Critical' | 'Major' | 'Minor' | 'Trivial';

export type BugStatus = 'Open' | 'In Progress' | 'Fixed' | 'Retest' | 'Closed' | 'Rejected';

export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  targetUrl?: string;
  repoUrl?: string;
  techStack: string[];
  rawRequirements?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface RequirementRisk {
  id: string;
  risk: string;
  severity: Priority;
  evidence: string;
  recommendation: string;
}

export interface Requirement {
  id: string;
  projectId: string;
  code: string; // e.g. REQ-AUTH-001
  title: string;
  content: string;
  type: 'Functional' | 'Security' | 'Performance' | 'Business' | 'Edge Case';
  priority: Priority;
  risks?: RequirementRisk[];
  testCaseCount?: number;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expected: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  requirementId?: string;
  code: string; // e.g. TC-AUTH-001
  title: string;
  description: string;
  priority: Priority;
  type: TestType;
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  risk: string;
  tags: string[];
  status: TestCaseStatus;
  aiNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepExecutionResult {
  stepNumber: number;
  status: StepStatus;
  actualNotes?: string;
}

export interface Evidence {
  id: string;
  testResultId: string;
  type: 'screenshot' | 'error_message' | 'console_log' | 'network_log' | 'notes';
  title: string;
  content: string;
  fileUrl?: string;
  timestamp: string;
}

export interface AIFailureAnalysis {
  id: string;
  failureSummary: string;
  probableCause: string;
  evidenceSupported: string[];
  confidence: ConfidenceLevel;
  suggestedInvestigation: string[];
  regressionRisk: string;
  recommendedFixDirection: string;
  analyzedAt: string;
  isRealAI?: boolean;
}

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  status: TestResultStatus;
  executedAt: string;
  executedBy: string;
  stepResults: StepExecutionResult[];
  actualResult?: string;
  errorMessage?: string;
  notes?: string;
  evidenceIds: string[];
  evidenceList?: Evidence[];
  bugId?: string;
  aiAnalysis?: AIFailureAnalysis;
}

export interface TestRun {
  id: string;
  runId: string; // e.g. RUN-2026-03-01
  projectId: string;
  name: string;
  environment: 'Production' | 'Staging' | 'Preview' | 'Local';
  startTime: string;
  endTime?: string;
  duration?: string;
  status: TestRunStatus;
  testCaseIds: string[];
  results: Record<string, TestResult>; // testCaseId -> TestResult
  summary?: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    notExecuted: number;
    passRate: number;
  };
}

export interface BugHistoryItem {
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
}

export interface Bug {
  id: string;
  bugId: string; // e.g. BUG-042
  projectId: string;
  testRunId?: string;
  testResultId?: string;
  testCaseId?: string;
  title: string;
  severity: BugSeverity;
  priority: Priority;
  status: BugStatus;
  environment: string;
  preconditions: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  evidenceNotes: string;
  probableCause: string;
  regressionRisk: string;
  suggestedFixDirection: string;
  assignedTo?: string;
  createdBy?: string;
  source: string; // e.g. "Test Run RUN-2026-001" or "Manual Audit"
  createdAt: string;
  updatedAt: string;
  history: BugHistoryItem[];
}

export interface QAInsight {
  id: string;
  projectId: string;
  title: string;
  severity: Priority;
  category: 'Ambiguity' | 'Security Risk' | 'Missing Requirement' | 'Edge Case' | 'Regression Danger';
  description: string;
  recommendation: string;
  createdAt: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  references?: Array<{
    type: 'testcase' | 'bug' | 'requirement' | 'run';
    id: string;
    label: string;
  }>;
}
