/**
 * Phase 7: Session Explanation Tests
 * 
 * Tests for session explanation fallback logic.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionExplanation } from '../SessionExplanation';
import type { PlanSession } from '@/types/execution';

describe('SessionExplanation', () => {
  it('uses session notes when available', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'easy',
      duration: 60,
      distance: 10,
      template_name: 'Easy Run',
      notes: 'This is a custom explanation from Phase 5 coach_text',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/This is a custom explanation from Phase 5 coach_text/i)).toBeInTheDocument();
  });

  it('falls back to default explanation when notes are absent', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'tempo',
      duration: 60,
      distance: 10,
      template_name: 'Tempo Run',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/Tempo session develops sustained speed/i)).toBeInTheDocument();
  });

  it('falls back to default explanation for easy sessions', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'easy',
      duration: 60,
      distance: 10,
      template_name: 'Easy Run',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/Easy run to build aerobic base/i)).toBeInTheDocument();
  });

  it('falls back to default explanation for long runs', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'long',
      duration: 120,
      distance: 20,
      template_name: 'Long Run',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/Long run builds endurance/i)).toBeInTheDocument();
  });

  it('falls back to default explanation for workout sessions', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'workout',
      duration: 60,
      template_name: 'Interval Workout',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/Structured workout to improve specific fitness/i)).toBeInTheDocument();
  });

  it('falls back to default explanation for rest days', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'rest',
      duration: 0,
      template_name: 'Rest Day',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/Rest day allows your body to adapt/i)).toBeInTheDocument();
  });

  it('handles unknown session types gracefully', () => {
    const session: PlanSession = {
      session_id: 'session-1',
      date: '2026-02-01',
      type: 'unknown' as 'easy',
      duration: 60,
      template_name: 'Unknown Session',
    };

    render(<SessionExplanation session={session} />);

    expect(screen.getByText(/Training session designed to improve your fitness/i)).toBeInTheDocument();
  });
});
