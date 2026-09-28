import type { StepStatus, TestResultStatus } from '../types/qa';

/** Derives a test result from step statuses. Returns null while any step is unmarked. */
export function computeResultStatus(steps: StepStatus[]): TestResultStatus | null {
  if (steps.length === 0) return null;
  if (steps.includes('FAIL')) return 'Failed';
  if (steps.includes('BLOCKED')) return 'Blocked';
  if (steps.includes('PENDING')) return null;
  return 'Passed';
}
