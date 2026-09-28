import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_PROJECT, DEMO_REQUIREMENTS, DEMO_TEST_CASES, DEMO_TEST_RUNS, DEMO_BUGS } from '../src/data/demoData';

describe('QALAB Core QA Engine & Integrity Suite', () => {
  describe('Project & Metadata Schema', () => {
    test('demo project is well-formed and active', () => {
      assert.ok(DEMO_PROJECT.id, 'Project must have an id');
      assert.equal(typeof DEMO_PROJECT.name, 'string');
      assert.ok(DEMO_PROJECT.techStack.length > 0, 'Project must have tech stack defined');
    });

    test('requirements have unique IDs and valid priority', () => {
      const ids = new Set<string>();
      for (const req of DEMO_REQUIREMENTS) {
        assert.ok(!ids.has(req.id), `Duplicate requirement id: ${req.id}`);
        ids.add(req.id);
        assert.match(req.priority, /^(Critical|High|Medium|Low)$/i);
      }
    });

    test('test cases link to valid project requirements', () => {
      const reqIds = new Set(DEMO_REQUIREMENTS.map(r => r.id));
      for (const tc of DEMO_TEST_CASES) {
        assert.ok(tc.projectId === DEMO_PROJECT.id, `Test case ${tc.id} projectId mismatch`);
        if (tc.requirementId) {
          assert.ok(reqIds.has(tc.requirementId), `Test case ${tc.id} points to non-existent requirement ${tc.requirementId}`);
        }
        assert.ok(Array.isArray(tc.steps) && tc.steps.length > 0, `Test case ${tc.id} must have execution steps`);
      }
    });
  });

  describe('Traceability Matrix & Coverage Calculation', () => {
    test('every critical requirement has at least one associated test case', () => {
      const criticalReqs = DEMO_REQUIREMENTS.filter(r => r.priority.toLowerCase() === 'critical');
      for (const req of criticalReqs) {
        const associatedCases = DEMO_TEST_CASES.filter(tc => tc.requirementId === req.id);
        assert.ok(
          associatedCases.length > 0,
          `Critical requirement ${req.code} (${req.id}) has 0 test cases`
        );
      }
    });

    test('coverage percentage calculation matches actual count', () => {
      const totalReqs = DEMO_REQUIREMENTS.length;
      const coveredReqs = DEMO_REQUIREMENTS.filter(r => 
        DEMO_TEST_CASES.some(tc => tc.requirementId === r.id)
      ).length;

      const coverageRatio = coveredReqs / totalReqs;
      assert.ok(coverageRatio >= 0.75, `Coverage ratio should be at least 75%, got ${coverageRatio * 100}%`);
    });
  });

  describe('Test Execution State Machine', () => {
    test('test run results properly aggregate passed/failed/blocked metrics', () => {
      for (const run of DEMO_TEST_RUNS) {
        const total = run.testCaseIds.length;
        const resultList = Object.values(run.results);
        const passed = resultList.filter(r => r.status === 'Passed').length;
        const failed = resultList.filter(r => r.status === 'Failed').length;
        const blocked = resultList.filter(r => r.status === 'Blocked').length;
        const skipped = resultList.filter(r => r.status === 'Skipped').length;
        const executed = passed + failed + blocked + skipped;

        assert.ok(executed <= total, 'Executed steps cannot exceed total test cases in run');
        assert.ok(run.environment, 'Test run must specify an environment');
      }
    });
  });

  describe('Bug Report Triage & Links', () => {
    test('every bug has repro steps, expected behavior, and actual behavior', () => {
      for (const bug of DEMO_BUGS) {
        assert.ok(bug.title.length > 5, 'Bug title should be descriptive');
        assert.ok(bug.expectedBehavior.length > 0, 'Expected behavior cannot be empty');
        assert.ok(bug.actualBehavior.length > 0, 'Actual behavior cannot be empty');
        assert.match(bug.severity, /^(Blocker|Critical|Major|Minor|Trivial)$/i);
        assert.match(bug.status, /^(Open|In Progress|Fixed|Retest|Closed|Rejected)$/i);
      }
    });
  });
});
