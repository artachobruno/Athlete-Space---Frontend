import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';

interface PlanChange {
  id: string;
  date: Date;
  type: 'adjustment' | 'replacement' | 'addition';
  description: string;
  reason: string;
}

const mockChanges: PlanChange[] = [
  {
    id: '1',
    date: subDays(new Date(), 1),
    type: 'adjustment',
    description: 'Thursday VO2max session reduced to tempo',
    reason: 'ATL elevated after Tuesday interval session. Reducing intensity to allow adequate recovery.',
  },
  {
    id: '2',
    date: subDays(new Date(), 3),
    type: 'replacement',
    description: 'Saturday long run moved to Sunday',
    reason: 'Weather conditions unfavorable for long endurance work on Saturday.',
  },
];

export function PlanChangeHistory() {
  const [isExpanded, setIsExpanded] = useState(false);

  if (mockChanges.length === 0) return null;

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
            {mockChanges.length} plan adjustment{mockChanges.length > 1 ? 's' : ''} this week
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
          {mockChanges.map((change) => (
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
