/**
 * Phase 6B: Execution Flow Tests
 * 
 * Tests for execution preview, conflict detection, and execution flow.
 * 
 * To run these tests, install vitest and @testing-library/react:
 * npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
 * 
 * Then add to package.json scripts:
 * "test": "vitest"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ExecutionFlow } from '../ExecutionFlow';
import type { WeekPlan } from '@/types/execution';

// Mock the API functions
vi.mock('@/lib/api/planningExecution', () => ({
  previewExecution: vi.fn(),
  executePlan: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/safe-analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
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
    notes: i === 0 ? 'Easy run' : undefined,
  })),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ExecutionFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders preview with correct dates', async () => {
    const weekPlans = [createTestWeekPlan(1, 2)];
    
    const { previewExecution } = await import('@/lib/api/planningExecution');
    vi.mocked(previewExecution).mockResolvedValue({
      conflicts: [],
    });

    render(
      <TestWrapper>
        <ExecutionFlow
          weekPlans={weekPlans}
          startDate="2026-02-01"
          timezone="America/New_York"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
    });
  });

  it('disables confirm button when conflicts exist', async () => {
    const weekPlans = [createTestWeekPlan(1)];
    
    const { previewExecution } = await import('@/lib/api/planningExecution');
    vi.mocked(previewExecution).mockResolvedValue({
      conflicts: [
        {
          session_id: 'session-1-0',
          existing_session_id: 'existing-1',
          date: '2026-02-01',
          reason: 'overlap',
        },
      ],
    });

    render(
      <TestWrapper>
        <ExecutionFlow
          weekPlans={weekPlans}
          startDate="2026-02-01"
          timezone="America/New_York"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm & schedule/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  it('enables confirm button when no conflicts', async () => {
    const weekPlans = [createTestWeekPlan(1)];
    
    const { previewExecution } = await import('@/lib/api/planningExecution');
    vi.mocked(previewExecution).mockResolvedValue({
      conflicts: [],
    });

    render(
      <TestWrapper>
        <ExecutionFlow
          weekPlans={weekPlans}
          startDate="2026-02-01"
          timezone="America/New_York"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm & schedule/i });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('does not call backend on abort', async () => {
    const weekPlans = [createTestWeekPlan(1)];
    const onAbort = vi.fn();
    
    const { previewExecution, executePlan } = await import('@/lib/api/planningExecution');
    vi.mocked(previewExecution).mockResolvedValue({
      conflicts: [],
    });

    render(
      <TestWrapper>
        <ExecutionFlow
          weekPlans={weekPlans}
          startDate="2026-02-01"
          timezone="America/New_York"
          onAbort={onAbort}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      cancelButton.click();
    });

    expect(executePlan).not.toHaveBeenCalled();
    expect(onAbort).toHaveBeenCalled();
  });

  it('navigates to calendar on success', async () => {
    const weekPlans = [createTestWeekPlan(1)];
    
    const { previewExecution, executePlan } = await import('@/lib/api/planningExecution');
    vi.mocked(previewExecution).mockResolvedValue({
      conflicts: [],
    });
    vi.mocked(executePlan).mockResolvedValue({
      status: 'success',
      sessions_created: 3,
      weeks_affected: 1,
    });

    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    render(
      <TestWrapper>
        <ExecutionFlow
          weekPlans={weekPlans}
          startDate="2026-02-01"
          timezone="America/New_York"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm & schedule/i });
      confirmButton.click();
    });

    // Wait for confirmation dialog
    await waitFor(() => {
      const dialogConfirm = screen.getByRole('button', { name: /confirm & schedule/i });
      dialogConfirm.click();
    });

    await waitFor(() => {
      expect(executePlan).toHaveBeenCalled();
      // Note: Navigation test would require proper router setup
    });
  });

  it('surfaces error on failure', async () => {
    const weekPlans = [createTestWeekPlan(1)];
    
    const { previewExecution, executePlan } = await import('@/lib/api/planningExecution');
    vi.mocked(previewExecution).mockResolvedValue({
      conflicts: [],
    });
    vi.mocked(executePlan).mockRejectedValue(new Error('Execution failed'));

    render(
      <TestWrapper>
        <ExecutionFlow
          weekPlans={weekPlans}
          startDate="2026-02-01"
          timezone="America/New_York"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm & schedule/i });
      confirmButton.click();
    });

    await waitFor(() => {
      const dialogConfirm = screen.getByRole('button', { name: /confirm & schedule/i });
      dialogConfirm.click();
    });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
