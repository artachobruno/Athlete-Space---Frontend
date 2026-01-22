import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';

import { MonthView } from './MonthView';
import { WeekCalendar } from './WeekCalendar';
import { SeasonView } from './SeasonView';
import { ActivityPopup } from './ActivityPopup';
import { AddSessionModal } from './AddSessionModal';
import { AddWeekModal } from './AddWeekModal';
import { AddRaceModal } from './AddRaceModal';

import { fetchCalendarSeason, type CalendarSession } from '@/lib/api';
import { downloadIcsFile } from '@/lib/ics-export';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';

import type { PlannedWorkout, CompletedActivity } from '@/types';

// Schedule page rules:
// - No coaching logic
// - No analytics
// - No vertical scrolling
// - Week view is default
// - This page answers: "When am I training?"

type ViewType = 'month' | 'week' | 'season';

export function TrainingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const isMobile = useIsMobile();

  // Navigation handlers - memoized for swipe gesture
  const navigatePrevious = useCallback(() => {
    if (view === 'month') setCurrentDate(prev => subMonths(prev, 1));
    else if (view === 'week') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 3));
  }, [view]);

  const navigateNext = useCallback(() => {
    if (view === 'month') setCurrentDate(prev => addMonths(prev, 1));
    else if (view === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 3));
  }, [view]);

  // Swipe gesture for mobile navigation
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: navigateNext,
    onSwipeRight: navigatePrevious,
    enabled: isMobile,
    threshold: 60,
  });

  const [activityPopupOpen, setActivityPopupOpen] = useState(false);
  const [selectedPlannedWorkout, setSelectedPlannedWorkout] =
    useState<PlannedWorkout | null>(null);
  const [selectedCompletedActivity, setSelectedCompletedActivity] =
    useState<CompletedActivity | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<CalendarSession | null>(null);

  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addWeekOpen, setAddWeekOpen] = useState(false);
  const [addRaceOpen, setAddRaceOpen] = useState(false);

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

  const goToToday = () => setCurrentDate(new Date());

  const getNavigationLabel = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
    return `Q${quarter} ${format(currentDate, 'yyyy')}`;
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
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 mb-4">
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

        {/* Actions - Planning tools only (no coaching, no analytics) */}
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setAddSessionOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Session
          </Button>

          <Button variant="outline" size="sm" onClick={() => setAddWeekOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Week
          </Button>

          <Button variant="outline" size="sm" onClick={() => setAddRaceOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Race
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

      {/* Views - Must fit in viewport without vertical scrolling */}
      <div ref={swipeRef} className="flex-1 min-h-0 overflow-hidden touch-pan-y">
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
      </div>

      {/* Activity Popup */}
      <ActivityPopup
        open={activityPopupOpen}
        onOpenChange={setActivityPopupOpen}
        plannedWorkout={selectedPlannedWorkout}
        completedActivity={selectedCompletedActivity}
        session={selectedSession}
        onStatusChange={invalidateCalendar}
      />

      {/* Modals */}
      <AddSessionModal
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        initialDate={currentDate}
        // Note: Query invalidation is handled by useCreatePlannedSession hook
      />

      <AddWeekModal
        open={addWeekOpen}
        onOpenChange={setAddWeekOpen}
        initialDate={currentDate}
        // Note: Query invalidation is handled by useCreatePlannedWeek hook
      />

      <AddRaceModal
        open={addRaceOpen}
        onOpenChange={setAddRaceOpen}
        initialDate={currentDate}
        // Note: Query invalidation is handled by useCreatePlannedSession hook
      />
    </div>
  );
}
