import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek } from 'date-fns';

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
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return `Week of ${format(weekStart, 'MMM d, yyyy')}`;
    }
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
    // Invalidate only active view queries (not season to prevent OOM refetch storms)
    queryClient.invalidateQueries({ queryKey: ['calendarWeek'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['calendar', 'month'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['calendarToday'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['calendarRange'], exact: false });
  };

  // NOTE: Season data is only used for ICS export, not for rendering.
  // For rendering, use range-based fetches (week/month views).
  // This prevents OOM by avoiding full season loads in memory.
  const { data: seasonData } = useAuthenticatedQuery({
    queryKey: ['calendarSeason'],
    queryFn: () => fetchCalendarSeason(),
    retry: 1,
    // Only fetch when explicitly needed (e.g., export), not on every render
    enabled: false, // Disable auto-fetch - will be enabled only when export is triggered
  });

  const handleExportIcs = async () => {
    // For ICS export, we need full season data, but fetch it on-demand
    try {
      const data = await fetchCalendarSeason();
      if (data?.sessions?.length) {
        downloadIcsFile(data.sessions);
      }
    } catch (error) {
      console.error('[Calendar] Failed to fetch season data for export:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-col gap-2 flex-shrink-0 mb-3">
        {/* Row 1: Navigation arrows + date label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={navigatePrevious}>
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={navigateNext}>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="ghost" onClick={goToToday} className="text-[10px] sm:text-xs h-7 px-2">
              Today
            </Button>
          </div>
          
          <span className="font-semibold text-foreground text-[11px] sm:text-sm">
            {getNavigationLabel()}
          </span>
        </div>

        {/* Row 2: View toggle (full width on mobile) */}
        <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="w-full">
          <TabsList className="h-7 w-full grid grid-cols-3 bg-muted/50">
            <TabsTrigger 
              value="week" 
              className="text-[10px] sm:text-xs h-6 data-[state=active]:bg-background"
            >
              Week
            </TabsTrigger>
            <TabsTrigger 
              value="month" 
              className="text-[10px] sm:text-xs h-6 data-[state=active]:bg-background"
            >
              Month
            </TabsTrigger>
            <TabsTrigger 
              value="season" 
              className="text-[10px] sm:text-xs h-6 data-[state=active]:bg-background"
            >
              Season
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Row 3: Action buttons - horizontally scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <Button 
            size="sm" 
            onClick={() => setAddSessionOpen(true)}
            className="h-6 text-[9px] sm:text-[10px] px-2 whitespace-nowrap flex-shrink-0"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
            Session
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAddWeekOpen(true)}
            className="h-6 text-[9px] sm:text-[10px] px-2 whitespace-nowrap flex-shrink-0"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
            Week
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAddRaceOpen(true)}
            className="h-6 text-[9px] sm:text-[10px] px-2 whitespace-nowrap flex-shrink-0"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
            Race
          </Button>

          <div className="h-3 w-px bg-border/40 flex-shrink-0" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportIcs}
            disabled={!seasonData?.sessions?.length}
            className="h-6 text-[9px] sm:text-[10px] px-2 whitespace-nowrap flex-shrink-0"
          >
            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
            ICS
          </Button>
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
