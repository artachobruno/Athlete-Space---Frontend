/**
 * Phase 7: Week Card Tests
 * 
 * Tests for week expand/collapse functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekCard } from '../WeekCard';
import type { PlanSession } from '@/types/execution';

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

const createTestSessions = (count: number): PlanSession[] => {
  return Array.from({ length: count }, (_, i) => ({
    session_id: `session-${i}`,
    date: `2026-02-0${i + 1}`,
    type: i === 0 ? 'easy' : i === 1 ? 'tempo' : 'rest',
    duration: i === 2 ? 0 : 60,
    distance: i === 2 ? undefined : 10,
    template_name: `Template ${i + 1}`,
  }));
};

describe('WeekCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders week card in collapsed state by default', () => {
    const sessions = createTestSessions(3);
    const totals = { durationMin: 120, distanceMiles: 12.4 };

    render(<WeekCard weekIndex={1} sessions={sessions} totals={totals} />);

    expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
    expect(screen.getByText(/3 sessions/i)).toBeInTheDocument();
  });

  it('expands to show sessions when clicked', async () => {
    const user = userEvent.setup();
    const sessions = createTestSessions(2);
    const totals = { durationMin: 120, distanceMiles: 12.4 };

    render(<WeekCard weekIndex={1} sessions={sessions} totals={totals} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/Template 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Template 2/i)).toBeInTheDocument();
    });
  });

  it('displays correct totals in collapsed view', () => {
    const sessions = createTestSessions(5);
    const totals = { durationMin: 240, distanceMiles: 24.8 };

    render(<WeekCard weekIndex={2} sessions={sessions} totals={totals} />);

    expect(screen.getByText(/5 sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/240 min/i)).toBeInTheDocument();
    expect(screen.getByText(/24.8 mi/i)).toBeInTheDocument();
  });

  it('sorts sessions chronologically when expanded', async () => {
    const user = userEvent.setup();
    const sessions: PlanSession[] = [
      {
        session_id: 'session-3',
        date: '2026-02-03',
        type: 'tempo',
        duration: 60,
        template_name: 'Third Session',
      },
      {
        session_id: 'session-1',
        date: '2026-02-01',
        type: 'easy',
        duration: 60,
        template_name: 'First Session',
      },
      {
        session_id: 'session-2',
        date: '2026-02-02',
        type: 'rest',
        duration: 0,
        template_name: 'Second Session',
      },
    ];
    const totals = { durationMin: 120, distanceMiles: 0 };

    render(<WeekCard weekIndex={1} sessions={sessions} totals={totals} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      const sessionCards = screen.getAllByText(/Session/i);
      // Should be sorted chronologically
      expect(sessionCards[0]).toHaveTextContent(/First Session/i);
      expect(sessionCards[1]).toHaveTextContent(/Second Session/i);
      expect(sessionCards[2]).toHaveTextContent(/Third Session/i);
    });
  });
});
