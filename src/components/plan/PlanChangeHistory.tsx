import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachRecommendations } from '@/lib/api';

interface PlanChange {
  id: string;
  date: Date;
  type: 'adjustment' | 'replacement' | 'addition';
  description: string;
  reason: string;
}

export function PlanChangeHistory() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch coach recommendations as they may indicate plan adjustments
  const { data: recommendations } = useQuery({
    queryKey: ['coach', 'recommendations'],
    queryFn: () => fetchCoachRecommendations(),
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - coach LLM call is expensive
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  // Convert recommendations to plan changes if they exist and are recent (this week)
  const planChanges: PlanChange[] = [];
  
  if (recommendations?.recommendations) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    recommendations.recommendations
      .filter(rec => {
        // Only show high priority recommendations from this week
        const recDate = new Date(rec.timestamp);
        return rec.priority === 'high' && recDate >= weekAgo;
      })
      .forEach((rec, index) => {
        planChanges.push({
          id: rec.id,
          date: new Date(rec.timestamp),
          type: 'adjustment' as const,
          description: rec.recommendation,
          reason: rec.rationale || rec.recommendation,
        });
      });
  }

  // Hide component if there are no plan changes
  if (planChanges.length === 0) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {planChanges.length} plan adjustment{planChanges.length > 1 ? 's' : ''} this week
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-3">
          {planChanges.map((change) => (
            <div key={change.id} className="flex gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-20">
                <Clock className="h-3 w-3" />
                {format(change.date, 'EEE d')}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{change.description}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{change.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
