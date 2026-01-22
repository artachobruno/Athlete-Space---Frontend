import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { CompletedActivity } from '@/types';
import type { TodayResponse, CalendarSession } from '@/lib/api';

interface TodayCompletionStatusProps {
  todayData?: TodayResponse | null;
  activities10?: CompletedActivity[] | null;
  todayIntelligence?: { recommendation?: string | null } | null;
}

interface CompletionRow {
  type: 'completed' | 'pending' | 'unplanned';
  session?: CalendarSession;
  activity?: CompletedActivity;
  label: string;
}

function mapRecommendationToDecision(recommendation: string | null | undefined): 'proceed' | 'modify' | 'replace' | 'rest' {
  if (!recommendation || typeof recommendation !== 'string') {
    return 'proceed';
  }
  const lower = recommendation.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'rest';
  if (lower.includes('modify') || lower.includes('adjust')) return 'modify';
  if (lower.includes('replace') || lower.includes('change')) return 'replace';
  return 'proceed';
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }
  return `${mins}`;
}

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

function formatActivityLabel(activity: CompletedActivity): string {
  const parts: string[] = [];
  
  if (activity.distance && activity.distance > 0) {
    parts.push(`${activity.distance.toFixed(1)} km`);
  }
  
  if (activity.duration && activity.duration > 0) {
    parts.push(`in ${formatDuration(activity.duration)}`);
  }
  
  if (activity.date) {
    const time = formatTime(activity.date);
    if (time) {
      parts.push(`(${time})`);
    }
  }
  
  return parts.join(' ');
}

export function TodayCompletionStatus({ todayData, activities10, todayIntelligence }: TodayCompletionStatusProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const decision = useMemo(() => {
    if (!todayIntelligence || typeof todayIntelligence !== 'object') {
      return 'proceed';
    }
    return mapRecommendationToDecision(todayIntelligence.recommendation);
  }, [todayIntelligence]);
  
  const plannedSessions = useMemo(() => {
    if (!todayData?.sessions) return [];
    return todayData.sessions.filter(s => s.status === 'planned');
  }, [todayData]);
  
  const todayActivities = useMemo(() => {
    if (!activities10) return [];
    return activities10.filter(activity => {
      const activityDate = activity.date?.split('T')[0] || activity.date;
      return activityDate === today;
    });
  }, [activities10, today]);
  
  const rows = useMemo(() => {
    const result: CompletionRow[] = [];
    const matchedActivityIds = new Set<string>();
    
    // Process planned sessions
    for (const session of plannedSessions) {
      let matchedActivity: CompletedActivity | undefined;
      
      // Check if session has a completed_activity_id
      if (session.completed_activity_id) {
        matchedActivity = todayActivities.find(a => a.id === session.completed_activity_id);
      } else {
        // Try to match by date and sport type
        const sessionSport = session.type.toLowerCase();
        matchedActivity = todayActivities.find(activity => {
          if (matchedActivityIds.has(activity.id)) return false;
          const activitySport = activity.sport.toLowerCase();
          return sessionSport === activitySport || 
                 sessionSport.includes(activitySport) || 
                 activitySport.includes(sessionSport);
        });
      }
      
      if (matchedActivity) {
        matchedActivityIds.add(matchedActivity.id);
        const label = formatActivityLabel(matchedActivity);
        result.push({
          type: 'completed',
          session,
          activity: matchedActivity,
          label: `${session.title || session.type} — ${label}`,
        });
      } else {
        result.push({
          type: 'pending',
          session,
          label: `${session.title || session.type} — Pending`,
        });
      }
    }
    
    // Find unplanned activities
    const unplannedActivities = todayActivities.filter(activity => !matchedActivityIds.has(activity.id));
    for (const activity of unplannedActivities) {
      const label = formatActivityLabel(activity);
      result.push({
        type: 'unplanned',
        activity,
        label: `Unplanned ${activity.sport} — ${label}`,
      });
    }
    
    return result;
  }, [plannedSessions, todayActivities]);
  
  // Don't render if rest day + no planned sessions (per requirements)
  if (decision === 'rest' && plannedSessions.length === 0) {
    return null;
  }
  
  // Don't render if no rows to show
  if (rows.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Completion Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((row, index) => {
            if (row.type === 'completed') {
              return (
                <div key={`${row.session?.id || index}`} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-foreground">{row.label}</span>
                </div>
              );
            }
            
            if (row.type === 'pending') {
              return (
                <div key={`${row.session?.id || index}`} className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{row.label}</span>
                </div>
              );
            }
            
            // unplanned
            return (
              <div key={`${row.activity?.id || index}`} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-foreground">{row.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
