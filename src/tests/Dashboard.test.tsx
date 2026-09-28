import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../components/dashboard/DashboardView';
import { DEMO_PROJECT, DEMO_TEST_CASES, DEMO_TEST_RUNS, DEMO_BUGS, DEMO_INSIGHTS } from '../data/demoData';

describe('DashboardView Component', () => {
  it('renders dashboard with project metrics and without runtime errors', () => {
    const handleNavigate = vi.fn();
    const handleOpenNewRun = vi.fn();
    const handleOpenNewProject = vi.fn();

    render(
      <DashboardView
        projects={[DEMO_PROJECT]}
        testCases={DEMO_TEST_CASES}
        testRuns={DEMO_TEST_RUNS}
        bugs={DEMO_BUGS}
        insights={DEMO_INSIGHTS}
        onNavigate={handleNavigate}
        onOpenNewRun={handleOpenNewRun}
        onOpenNewProject={handleOpenNewProject}
      />
    );

    // Verify key headings and sections exist
    expect(screen.getByText('Quality Engineering Console')).toBeDefined();
    expect(screen.getByText('Suite Pass Rate')).toBeDefined();
    expect(screen.queryByText(/\+4\.2%/)).toBeNull(); // no fabricated trend
  });

  it('renders correctly when data lists are empty', () => {
    render(
      <DashboardView
        projects={[]}
        testCases={[]}
        testRuns={[]}
        bugs={[]}
        insights={[]}
        onNavigate={vi.fn()}
        onOpenNewRun={vi.fn()}
        onOpenNewProject={vi.fn()}
      />
    );

    expect(screen.getByText('Quality Engineering Console')).toBeDefined();
    expect(screen.getByText('0%')).toBeDefined();
  });
});
