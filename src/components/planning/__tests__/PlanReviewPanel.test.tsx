/**
 * Phase 7: Plan Review Panel Tests
 * 
 * Tests for plan review panel, week expand/collapse, modal confirmation gating.
 * 
 * To run these tests, install vitest and @testing-library/react:
 * npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PlanReviewPanel } from '../PlanReviewPanel';
import type { WeekPlan } from '@/types/execution';

// Mock the useUnitSystem hook
vi.mock('@/hooks/useUnitSystem', () => ({
  useUnitSystem: () => ({
    unitSystem: 'imperial',
    convertDistance: (km: number) => ({
      value: km * 0.621371,
      unit: 'mi',
    }),
  }),
}));

const createTestWeekPlan = (week: number, sessionCount: number = 3): WeekPlan => ({
  week,
  weekStart: `2026-02-${1 + (week - 1) * 7}`,
  weekEnd: `2026-02-${7 + (week - 1) * 7}`,
  sessions: Array.from({ length: sessionCount }, (_, i) => ({
    session_id: `session-${week}-${i}`,
    date: `2026-02-${1 + (week - 1) * 7 + i}`,
    type: i === 0 ? 'easy' : i === 1 ? 'tempo' : 'rest',
    duration: i === 2 ? 0 : 60,
    distance: i === 2 ? undefined : 10,
    template_name: `Template ${i + 1}`,
    notes: i === 0 ? 'Easy run to build aerobic base' : undefined,
  })),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('PlanReviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan review panel with weeks', () => {
    const weekPlans = [createTestWeekPlan(1, 2), createTestWeekPlan(2, 2)];
    const onExecuteRequested = vi.fn();

    render(
      <TestWrapper>
        <PlanReviewPanel plan={weekPlans} onExecuteRequested={onExecuteRequested} />
      </TestWrapper>
    );

    expect(screen.getByText(/Review Your Training Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing is scheduled yet/i)).toBeInTheDocument();
  });

  it('opens execution modal when Schedule Plan is clicked', async () => {
    const user = userEvent.setup();
    const weekPlans = [createTestWeekPlan(1)];
    const onExecuteRequested = vi.fn();

    render(
      <TestWrapper>
        <PlanReviewPanel plan={weekPlans} onExecuteRequested={onExecuteRequested} />
      </TestWrapper>
    );

    const scheduleButton = screen.getByRole('button', { name: /Schedule Plan/i });
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText(/Schedule training plan\?/i)).toBeInTheDocument();
    });
  });

  it('does not call onExecuteRequested when modal is cancelled', async () => {
    const user = userEvent.setup();
    const weekPlans = [createTestWeekPlan(1)];
    const onExecuteRequested = vi.fn();

    render(
      <TestWrapper>
        <PlanReviewPanel plan={weekPlans} onExecuteRequested={onExecuteRequested} />
      </TestWrapper>
    );

    const scheduleButton = screen.getByRole('button', { name: /Schedule Plan/i });
    await user.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText(/Schedule training plan\?/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(onExecuteRequested).not.toHaveBeenCalled();
  });

  it('shows empty state when plan is empty', () => {
    const onExecuteRequested = vi.fn();

    render(
      <TestWrapper>
        <PlanReviewPanel plan={[]} onExecuteRequested={onExecuteRequested} />
      </TestWrapper>
    );

    expect(screen.getByText(/No plan to review/i)).toBeInTheDocument();
  });
});
