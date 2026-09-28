import { 
  Project, Requirement, TestCase, TestRun, Bug, QAInsight, TestResult, AIFailureAnalysis, RequirementRisk 
} from '../types/qa';

export interface AuthUser { id: string; email: string; name: string; role: 'admin' | 'member'; createdAt: string }

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (res.status === 401 && !endpoint.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('qalab:unauthorized'));
    }
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  // Engine status (requires a session)
  async getEngine(): Promise<{ hasGeminiKey: boolean; model: string; stats: any }> {
    return this.request('/api/engine');
  }

  // Auth & users
  async authStatus(): Promise<{ authDisabled: boolean; needsSetup: boolean; signupOpen: boolean; user: AuthUser | null }> {
    return this.request('/api/auth/status');
  }
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  async register(name: string, email: string, password: string): Promise<{ user: AuthUser }> {
    return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  }
  async logout(): Promise<{ success: boolean }> {
    return this.request('/api/auth/logout', { method: 'POST' });
  }
  async listUsers(): Promise<AuthUser[]> {
    return this.request('/api/users');
  }
  async createUser(data: { name: string; email: string; password: string; role: 'admin' | 'member' }): Promise<AuthUser> {
    return this.request('/api/users', { method: 'POST', body: JSON.stringify(data) });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request('/api/projects');
  }

  async getProjectDetails(id: string): Promise<{
    project: Project;
    requirements: Requirement[];
    testCases: TestCase[];
    testRuns: TestRun[];
    bugs: Bug[];
    insights: QAInsight[];
  }> {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Requirements
  async getRequirements(projectId?: string): Promise<Requirement[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/api/requirements${query}`);
  }

  async analyzeRequirements(data: {
    projectId?: string;
    rawText: string;
    projectName?: string;
    techStack?: string[];
  }): Promise<{
    success: boolean;
    isRealAI: boolean;
    requirements: Requirement[];
    insights: QAInsight[];
    warning?: string;
  }> {
    return this.request('/api/requirements/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanRequirementRisks(data: {
    requirementsText: string;
    projectId?: string;
  }): Promise<{
    success: boolean;
    isRealAI: boolean;
    risks: RequirementRisk[];
  }> {
    return this.request('/api/requirements/risks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Test Cases
  async getTestCases(params?: { projectId?: string; requirementId?: string; status?: string; type?: string }): Promise<TestCase[]> {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    if (params?.requirementId) searchParams.set('requirementId', params.requirementId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/test-cases${query}`);
  }

  async generateTestCases(data: {
    projectId?: string;
    requirementId?: string;
    requirementText: string;
    projectContext?: string;
    testFocus?: string;
  }): Promise<{
    success: boolean;
    isRealAI: boolean;
    testCases: TestCase[];
    warning?: string;
  }> {
    return this.request('/api/test-cases/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async improveTestCase(testCase: TestCase, instruction?: string): Promise<{
    success: boolean;
    isRealAI: boolean;
    testCase: TestCase;
  }> {
    return this.request('/api/test-cases/improve', {
      method: 'POST',
      body: JSON.stringify({ testCase, instruction }),
    });
  }

  async createTestCase(data: Partial<TestCase>): Promise<TestCase> {
    return this.request('/api/test-cases', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTestCase(id: string, updates: Partial<TestCase>): Promise<TestCase> {
    return this.request(`/api/test-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTestCase(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/test-cases/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Runs
  async getTestRuns(projectId?: string): Promise<TestRun[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/api/test-runs${query}`);
  }

  async getTestRun(id: string): Promise<TestRun> {
    return this.request(`/api/test-runs/${id}`);
  }

  async createTestRun(data: {
    projectId?: string;
    name?: string;
    environment?: string;
    testCaseIds?: string[];
  }): Promise<TestRun> {
    return this.request('/api/test-runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTestRunResult(runId: string, resultData: Partial<TestResult>): Promise<{
    run: TestRun;
    result: TestResult;
  }> {
    return this.request(`/api/test-runs/${runId}/results`, {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  }

  // Failure Analysis
  async analyzeFailure(data: {
    testCase: TestCase;
    actualResult: string;
    errorMessage?: string;
    evidenceList?: any[];
    previousContext?: string;
  }): Promise<{
    success: boolean;
    isRealAI: boolean;
    analysis: AIFailureAnalysis;
  }> {
    return this.request('/api/failures/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bug Generator & Management
  async generateBugReport(data: {
    testCase: TestCase;
    testResult: TestResult;
    analysis?: AIFailureAnalysis;
    projectId?: string;
    testRunId?: string;
  }): Promise<{
    success: boolean;
    isRealAI: boolean;
    bug: Bug;
  }> {
    return this.request('/api/bugs/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBugs(params?: { projectId?: string; severity?: string; status?: string }): Promise<Bug[]> {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/api/bugs${query}`);
  }

  async updateBug(id: string, updates: Partial<Bug> & { note?: string }): Promise<Bug> {
    return this.request(`/api/bugs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // QA Copilot
  async queryCopilot(data: {
    message: string;
    projectId?: string;
    conversationHistory?: any[];
  }): Promise<{
    success: boolean;
    isRealAI: boolean;
    reply: string;
  }> {
    return this.request('/api/copilot', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reset Demo
  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/reset-demo', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
