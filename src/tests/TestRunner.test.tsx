import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestRunsView } from '../components/testrunner/TestRunsView';
import { TestExecutionRunner } from '../components/testrunner/TestExecutionRunner';
import { DEMO_PROJECT, DEMO_TEST_RUNS, DEMO_TEST_CASES } from '../data/demoData';

describe('TestRunner Components Suite', () => {
  describe('TestRunsView Component', () => {
    it('renders test run list and execution statistics without errors', () => {
      const handleSelectRun = vi.fn();
      const handleCreateRun = vi.fn().mockResolvedValue(undefined);

      render(
        <TestRunsView
          project={DEMO_PROJECT}
          testRuns={DEMO_TEST_RUNS}
          testCases={DEMO_TEST_CASES}
          onSelectRun={handleSelectRun}
          onCreateRun={handleCreateRun}
        />
      );

      // Verify header and table headings
      expect(screen.getByText('Test Execution Runs')).toBeDefined();
      expect(screen.getByText('Launch New Test Run')).toBeDefined();
      // Verify demo run row is rendered
      expect(screen.getByText(DEMO_TEST_RUNS[0].name)).toBeDefined();
    });
  });

  describe('TestExecutionRunner Component', () => {
    it('renders active test execution runner with steps and controls', () => {
      const activeRun = DEMO_TEST_RUNS[0];
      const runCases = DEMO_TEST_CASES.filter(t => activeRun.testCaseIds.includes(t.id));
      const handleBack = vi.fn();
      const handleUpdateResult = vi.fn().mockResolvedValue(undefined);
      const handleTriggerAnalysis = vi.fn();

      render(
        <TestExecutionRunner
          testRun={activeRun}
          testCases={runCases}
          onBack={handleBack}
          onUpdateRunResult={handleUpdateResult}
          onTriggerFailureAnalysis={handleTriggerAnalysis}
        />
      );

      // Verify breadcrumbs and execution interface
            expect(screen.getByText(activeRun.name)).toBeDefined();
      expect(screen.getAllByText(/Execution|Steps/i).length).toBeGreaterThan(0);
    });
  });
});
