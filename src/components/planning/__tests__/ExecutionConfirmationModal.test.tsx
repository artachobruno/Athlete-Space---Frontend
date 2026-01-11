/**
 * Phase 7: Execution Confirmation Modal Tests
 * 
 * Tests for modal confirmation gating, checkbox requirement, and disabled state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutionConfirmationModal } from '../ExecutionConfirmationModal';
import type { WeekPlan } from '@/types/execution';

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
  })),
});

describe('ExecutionConfirmationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables confirm button when checkbox is not checked', async () => {
    const weekPlans = [createTestWeekPlan(1)];
    const onConfirm = vi.fn();

    render(
      <ExecutionConfirmationModal
        open={true}
        onOpenChange={vi.fn()}
        plans={weekPlans}
        onConfirm={onConfirm}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm & Schedule/i });
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm button when checkbox is checked', async () => {
    const user = userEvent.setup();
    const weekPlans = [createTestWeekPlan(1)];
    const onConfirm = vi.fn();

    render(
      <ExecutionConfirmationModal
        open={true}
        onOpenChange={vi.fn()}
        plans={weekPlans}
        onConfirm={onConfirm}
      />
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /I understand this will add sessions to my calendar/i,
    });
    await user.click(checkbox);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /Confirm & Schedule/i });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('calls onConfirm when confirm button is clicked with checkbox checked', async () => {
    const user = userEvent.setup();
    const weekPlans = [createTestWeekPlan(1, 5)];
    const onConfirm = vi.fn();

    render(
      <ExecutionConfirmationModal
        open={true}
        onOpenChange={vi.fn()}
        plans={weekPlans}
        onConfirm={onConfirm}
      />
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /I understand this will add sessions to my calendar/i,
    });
    await user.click(checkbox);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /Confirm & Schedule/i });
      expect(confirmButton).not.toBeDisabled();
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm & Schedule/i });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('displays correct session count', () => {
    const weekPlans = [createTestWeekPlan(1, 5), createTestWeekPlan(2, 3)];
    const onConfirm = vi.fn();

    render(
      <ExecutionConfirmationModal
        open={true}
        onOpenChange={vi.fn()}
        plans={weekPlans}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText(/8/)).toBeInTheDocument(); // 5 + 3 = 8 sessions
  });

  it('disables all controls when isExecuting is true', () => {
    const user = userEvent.setup();
    const weekPlans = [createTestWeekPlan(1)];
    const onConfirm = vi.fn();

    render(
      <ExecutionConfirmationModal
        open={true}
        onOpenChange={vi.fn()}
        plans={weekPlans}
        onConfirm={onConfirm}
        isExecuting={true}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    const confirmButton = screen.getByRole('button', { name: /Confirm & Schedule/i });
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });

    expect(checkbox).toBeDisabled();
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
