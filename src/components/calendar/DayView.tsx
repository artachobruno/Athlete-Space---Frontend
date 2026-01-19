import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Footprints,
  Bike,
  Waves,
  Dumbbell,
  Activity,
  Clock,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  CalendarItem,
  CalendarSport,
  CalendarIntent,
} from '@/types/calendar';

interface DayViewProps {
  date: Date;
  items: CalendarItem[];
  onBack?: () => void;
  onItemClick?: (item: CalendarItem) => void;
}

const sportIcons: Record<CalendarSport, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  swim: Waves,
  strength: Dumbbell,
  race: Activity,
  other: Activity,
};

const sportLabels: Record<CalendarSport, string> = {
  run: 'Run',
  ride: 'Ride',
  swim: 'Swim',
  strength: 'Strength',
  race: 'Race',
  other: 'Activity',
};

const intentLabels: Record<CalendarIntent, string> = {
  easy: 'Easy',
  steady: 'Steady',
  tempo: 'Tempo',
  intervals: 'Intervals',
  long: 'Long Run',
  rest: 'Rest Day',
};

const intentColors: Record<CalendarIntent, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  steady: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  tempo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  intervals: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  long: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  rest: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

// Mock structured phases - in real app, this would come from the workout data
function getWorkoutPhases(item: CalendarItem): { type: string; duration: number; notes: string }[] {
  const phases = [];
  const totalMin = item.durationMin;
  
  if (item.intent === 'intervals') {
    phases.push({ type: 'Warmup', duration: Math.round(totalMin * 0.2), notes: 'Easy pace, build gradually' });
    phases.push({ type: 'Main Set', duration: Math.round(totalMin * 0.6), notes: `${item.secondary || 'Hard effort'} intervals` });
    phases.push({ type: 'Cooldown', duration: Math.round(totalMin * 0.2), notes: 'Easy pace, recover' });
  } else if (item.intent === 'tempo') {
    phases.push({ type: 'Warmup', duration: Math.round(totalMin * 0.15), notes: 'Easy pace' });
    phases.push({ type: 'Tempo', duration: Math.round(totalMin * 0.7), notes: `Sustained ${item.secondary || 'threshold'} effort` });
    phases.push({ type: 'Cooldown', duration: Math.round(totalMin * 0.15), notes: 'Easy pace' });
  } else if (item.intent === 'long') {
    phases.push({ type: 'Warmup', duration: 10, notes: 'Start easy' });
    phases.push({ type: 'Steady', duration: totalMin - 20, notes: `${item.secondary || 'Aerobic'} effort` });
    phases.push({ type: 'Cooldown', duration: 10, notes: 'Finish easy' });
  } else {
    phases.push({ type: 'Main', duration: totalMin, notes: `${item.secondary || 'Easy'} effort throughout` });
  }
  
  return phases;
}

export function DayView({ date, items, onBack, onItemClick }: DayViewProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(a.startLocal).getTime() - new Date(b.startLocal).getTime();
    });
  }, [items]);
  
  const daySummary = useMemo(() => {
    return {
      totalDuration: items.reduce((sum, i) => sum + i.durationMin, 0),
      totalLoad: items.reduce((sum, i) => sum + (i.load || 0), 0),
      completed: items.filter(i => i.kind === 'completed').length,
      planned: items.filter(i => i.kind === 'planned').length,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {format(date, 'EEEE')}
            </h2>
            <p className="text-muted-foreground">
              {format(date, 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        
        {/* Day Summary Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{daySummary.totalDuration}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </div>
          {daySummary.totalLoad > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{Math.round(daySummary.totalLoad)}</p>
              <p className="text-xs text-muted-foreground">TSS</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{items.length}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </div>
        </div>
      </div>
      
      {/* No sessions */}
      {items.length === 0 && (
        <GlassCard className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sessions scheduled for this day</p>
          </CardContent>
        </GlassCard>
      )}
      
      {/* Session Cards */}
      <div className="space-y-4">
        {sortedItems.map((item) => {
          const Icon = sportIcons[item.sport] || Activity;
          const phases = getWorkoutPhases(item);
          const time = format(parseISO(item.startLocal), 'h:mm a');
          
          return (
            <GlassCard
              key={item.id}
              className={cn(
                'overflow-hidden cursor-pointer transition-all hover:shadow-lg',
                item.kind === 'completed' && 'border-2',
                item.kind === 'planned' && 'border-dashed',
              )}
              onClick={() => onItemClick?.(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex items-center justify-center w-14 h-14 rounded-xl',
                      intentColors[item.intent]
                    )}>
                      <Icon className="h-7 w-7" />
                    </div>
                    
                    <div>
                      <CardTitle className="text-lg">
                        {intentLabels[item.intent]}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sportLabels[item.sport]} • {time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.kind === 'completed' ? 'default' : 'outline'}
                      className={cn(
                        item.kind === 'completed' && item.compliance === 'complete' && 'bg-emerald-500',
                        item.kind === 'completed' && item.compliance === 'partial' && 'bg-amber-500',
                        item.kind === 'completed' && item.compliance === 'missed' && 'bg-destructive',
                      )}
                    >
                      {item.kind === 'completed' 
                        ? item.compliance === 'complete' 
                          ? 'Completed' 
                          : item.compliance === 'partial'
                            ? 'Partial'
                            : 'Missed'
                        : 'Planned'
                      }
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metrics Row */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.durationMin} min</span>
                  </div>
                  {item.secondary && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>{item.secondary}</span>
                    </div>
                  )}
                  {item.load && item.load > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Load:</span>
                      <span className="font-medium">{Math.round(item.load)} TSS</span>
                    </div>
                  )}
                </div>
                
                {/* Structured Phases */}
                <div className="border-t pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Workout Structure
                  </h4>
                  <div className="space-y-2">
                    {phases.map((phase, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <span className="text-xs font-medium text-foreground">
                            {phase.type}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {phase.duration} min
                        </div>
                        <div className="flex-1 text-xs text-muted-foreground truncate">
                          {phase.notes}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
