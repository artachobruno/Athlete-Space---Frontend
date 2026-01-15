import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, MessageCircle, Download, Plus } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';

import { MonthView } from './MonthView';
import { WeekCalendar } from './WeekCalendar';
import { SeasonView } from './SeasonView';
import { CoachDrawer } from './CoachDrawer';
import { ActivityPopup } from './ActivityPopup';
import { AddSessionModal } from './AddSessionModal';
import { AddWeekModal } from './AddWeekModal';

import { fetchCalendarSeason, type CalendarSession } from '@/lib/api';
import { downloadIcsFile } from '@/lib/ics-export';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

import type { PlannedWorkout, CompletedActivity } from '@/types';

type ViewType = 'month' | 'week' | 'season';

export function TrainingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  const [coachOpen, setCoachOpen] = useState(false);

  const [activityPopupOpen, setActivityPopupOpen] = useState(false);
  const [selectedPlannedWorkout, setSelectedPlannedWorkout] =
    useState<PlannedWorkout | null>(null);
  const [selectedCompletedActivity, setSelectedCompletedActivity] =
    useState<CompletedActivity | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<CalendarSession | null>(null);

  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addWeekOpen, setAddWeekOpen] = useState(false);

  const queryClient = useQueryClient();

  // Restore calendar focus date (from plan generation, etc.)
  useEffect(() => {
    const storedDate = localStorage.getItem('calendarFocusDate');
    if (!storedDate) return;

    const parsed = new Date(storedDate);
    if (!isNaN(parsed.getTime())) {
      setCurrentDate(parsed);
    }
    localStorage.removeItem('calendarFocusDate');
  }, []);

  const navigatePrevious = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 3));
  };

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 3));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getNavigationLabel = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
    return `Q${quarter} ${format(currentDate, 'yyyy')}`;
  };

  const handleAskCoach = () => {
    setCoachOpen(true);
  };

  const handleActivityClick = (
    planned: PlannedWorkout | null,
    completed: CompletedActivity | null,
    session?: CalendarSession | null
  ) => {
    setSelectedPlannedWorkout(planned);
    setSelectedCompletedActivity(completed);
    setSelectedSession(session ?? null);
    setActivityPopupOpen(true);
  };

  const invalidateCalendar = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['calendarWeek'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['calendarSeason'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['calendarToday'], exact: false });
  };

  const { data: seasonData } = useAuthenticatedQuery({
    queryKey: ['calendarSeason'],
    queryFn: () => fetchCalendarSeason(),
    retry: 1,
  });

  const handleExportIcs = () => {
    if (seasonData?.sessions?.length) {
      downloadIcsFile(seasonData.sessions);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={goToToday} className="text-sm">
            Today
          </Button>
          <span className="font-semibold text-foreground ml-2">
            {getNavigationLabel()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setAddSessionOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Session
          </Button>

          <Button variant="outline" size="sm" onClick={() => setAddWeekOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Week
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAskCoach}
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Ask Coach
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportIcs}
            disabled={!seasonData?.sessions?.length}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export ICS
          </Button>

          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="season">Season</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Views */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          onActivityClick={handleActivityClick}
        />
      )}

      {view === 'week' && (
        <WeekCalendar
          currentDate={currentDate}
          onActivityClick={handleActivityClick}
        />
      )}

      {view === 'season' && <SeasonView currentDate={currentDate} />}

      {/* Activity Popup (Month only) */}
      <ActivityPopup
        open={activityPopupOpen}
        onOpenChange={setActivityPopupOpen}
        plannedWorkout={selectedPlannedWorkout}
        completedActivity={selectedCompletedActivity}
        session={selectedSession}
        onAskCoach={handleAskCoach}
        onStatusChange={invalidateCalendar}
      />

      {/* Coach Drawer */}
      <CoachDrawer open={coachOpen} onOpenChange={setCoachOpen} />

      {/* Modals */}
      <AddSessionModal
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        initialDate={currentDate}
        onSuccess={invalidateCalendar}
      />

      <AddWeekModal
        open={addWeekOpen}
        onOpenChange={setAddWeekOpen}
        initialDate={currentDate}
        onSuccess={invalidateCalendar}
      />
    </div>
  );
}
