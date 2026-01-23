// Season view: Narrative timeline showing how the season is unfolding
// - Read-only story view
// - No calendar mechanics
// - No metrics or charts
// - Phases → Weeks → Coach summaries

import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useAuth } from '@/context/AuthContext';
import { fetchSeasonSummary, type SeasonSummary } from '@/lib/api';
import { Loader2, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SeasonViewProps {
  currentDate: Date;
}

export function SeasonView({ currentDate }: SeasonViewProps) {
  const { status: authStatus } = useAuth();

  const { data: seasonSummary, isLoading } = useAuthenticatedQuery({
    queryKey: ['seasonSummary'],
    queryFn: () => fetchSeasonSummary(),
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading season narrative...</span>
      </Card>
    );
  }

  if (!seasonSummary) {
    return (
      <Card className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">
          Season narrative not available. The coach is still learning about your training patterns.
        </span>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-semibold mb-2">Season</h2>
        <p className="text-sm text-muted-foreground">
          Your season, week by week — how the plan is unfolding in reality.
        </p>
      </div>

      {/* Goal Race Info */}
      {seasonSummary.goal_race && (
        <Card className="mb-6 p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Goal Race</h3>
              <p className="text-sm text-muted-foreground">
                {seasonSummary.goal_race.name} • {seasonSummary.goal_race.weeks_to_race} weeks remaining
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Phases Timeline */}
      <div className="flex-1 space-y-8">
        {seasonSummary.phases.map((phase, phaseIndex) => {
          const isCurrentPhase = phase.name === seasonSummary.current_phase;
          
          return (
            <div key={phaseIndex} className="relative">
              {/* Phase Header */}
              <div className={cn(
                "mb-4 pb-2 border-b",
                isCurrentPhase && "border-primary"
              )}>
                <div className="flex items-center gap-3">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    isCurrentPhase && "text-primary"
                  )}>
                    PHASE: {phase.name.toUpperCase()}
                  </h3>
                  {isCurrentPhase && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Intent: {phase.intent}
                </p>
              </div>

              {/* Weeks in Phase */}
              <div className="space-y-4 ml-4 border-l-2 border-muted pl-6">
                {phase.weeks.map((week) => (
                  <WeekBlock key={week.week_index} week={week} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WeekBlockProps {
  week: {
    week_index: number;
    date_range: string;
    status: "completed" | "current" | "upcoming";
    coach_summary: string;
    key_sessions: string[];
    flags: ("fatigue" | "missed_sessions")[];
  };
}

function WeekBlock({ week }: WeekBlockProps) {
  const getStatusIcon = () => {
    switch (week.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
      case "current":
        return <Circle className="h-4 w-4 text-primary fill-primary" />;
      case "upcoming":
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = () => {
    switch (week.status) {
      case "completed":
        return "Completed";
      case "current":
        return "In progress";
      case "upcoming":
        return "Upcoming";
    }
  };

  return (
    <div className={cn(
      "relative pb-6",
      week.status === "current" && "bg-muted/20 -ml-6 -pl-6 pr-4 pt-4 rounded-r-md"
    )}>
      {/* Week Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">
              Week {week.week_index} ({week.date_range})
            </span>
            <Badge 
              variant={week.status === "current" ? "default" : "outline"}
              className="text-xs"
            >
              {getStatusLabel()}
            </Badge>
            {week.flags.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {week.flags.includes("fatigue") && "Fatigue"}
                {week.flags.includes("missed_sessions") && "Missed Sessions"}
              </Badge>
            )}
          </div>

          {/* Coach Summary */}
          <p className="text-sm text-muted-foreground mb-2 italic">
            Coach: "{week.coach_summary}"
          </p>

          {/* Key Sessions */}
          {week.key_sessions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Key focus:</p>
              <div className="flex flex-wrap gap-1">
                {week.key_sessions.map((session, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {session}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
