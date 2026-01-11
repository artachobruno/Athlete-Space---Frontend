/**
 * Phase 7: Plan Review Panel (Root Component)
 * 
 * Owns the review state and renders all weeks.
 * Triggers execution modal on user confirmation.
 * 
 * Read-only until execution - UI renders backend facts only.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WeekCard } from './WeekCard';
import { PlanOverviewSidebar } from './PlanOverviewSidebar';
import { ExecutionConfirmationModal } from './ExecutionConfirmationModal';
import type { WeekPlan } from '@/types/execution';

interface PlanReviewPanelProps {
  plan: WeekPlan[];
  onExecuteRequested: () => void;
  raceType?: string;
  philosophyName?: string;
}

/**
 * Calculate week totals (duration and distance)
 */
function calculateWeekTotals(sessions: WeekPlan['sessions']) {
  const durationMin = sessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );

  // Convert km to miles for totals
  const distanceKm = sessions.reduce(
    (sum, session) => sum + (session.distance || 0),
    0
  );
  const distanceMiles = distanceKm * 0.621371;

  return { durationMin, distanceMiles };
}

export function PlanReviewPanel({
  plan,
  onExecuteRequested,
  raceType,
  philosophyName,
}: PlanReviewPanelProps) {
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  const handleScheduleClick = () => {
    setShowExecutionModal(true);
  };

  const handleExecuteConfirm = () => {
    setShowExecutionModal(false);
    onExecuteRequested();
  };

  if (plan.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No plan to review</p>
        <p className="text-sm">Please generate a plan first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Review Your Training Plan</h2>
        <p className="text-sm text-muted-foreground">
          Nothing is scheduled yet. Review each week and session before
          scheduling.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Week Cards (Left side - 3 columns on large screens) */}
        <div className="lg:col-span-3 space-y-4">
          {plan.map((week) => {
            const totals = calculateWeekTotals(week.sessions);
            return (
              <WeekCard
                key={week.week}
                weekIndex={week.week}
                sessions={week.sessions}
                totals={totals}
              />
            );
          })}
        </div>

        {/* Sidebar (Right side - 1 column on large screens) */}
        <div className="lg:col-span-1">
          <PlanOverviewSidebar
            plans={plan}
            raceType={raceType}
            philosophyName={philosophyName}
          />
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 -mx-6 px-6 mt-6">
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={handleScheduleClick}
            className="bg-primary hover:bg-primary/90"
            size="lg"
          >
            Schedule Plan
          </Button>
        </div>
      </div>

      {/* Execution Confirmation Modal */}
      <ExecutionConfirmationModal
        open={showExecutionModal}
        onOpenChange={setShowExecutionModal}
        plans={plan}
        onConfirm={handleExecuteConfirm}
      />
    </div>
  );
}
