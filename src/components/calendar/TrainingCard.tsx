import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Footprints, 
  Bike, 
  Waves, 
  Dumbbell, 
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { 
  CalendarItem, 
  GroupedCalendarItem,
  CalendarSport,
  CalendarCompliance,
} from '@/types/calendar';

interface TrainingCardProps {
  group: GroupedCalendarItem;
  variant?: 'compact' | 'expanded';
  onClick?: (item: CalendarItem) => void;
}

const sportIcons: Record<CalendarSport, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  swim: Waves,
  strength: Dumbbell,
  other: Activity,
};

const intentLabels: Record<string, string> = {
  easy: 'Easy',
  steady: 'Steady',
  tempo: 'Tempo',
  intervals: 'Intervals',
  long: 'Long',
  rest: 'Rest',
};

const intentColors: Record<string, string> = {
  easy: 'border-emerald-500/40 bg-emerald-500/5',
  steady: 'border-blue-500/40 bg-blue-500/5',
  tempo: 'border-amber-500/40 bg-amber-500/5',
  intervals: 'border-red-500/40 bg-red-500/5',
  long: 'border-purple-500/40 bg-purple-500/5',
  rest: 'border-muted-foreground/30 bg-muted/20',
};

const intentTextColors: Record<string, string> = {
  easy: 'text-emerald-600 dark:text-emerald-400',
  steady: 'text-blue-600 dark:text-blue-400',
  tempo: 'text-amber-600 dark:text-amber-400',
  intervals: 'text-red-600 dark:text-red-400',
  long: 'text-purple-600 dark:text-purple-400',
  rest: 'text-muted-foreground',
};

function getCardStyles(
  kind: 'planned' | 'completed',
  compliance: CalendarCompliance | undefined,
  intent: string
): string {
  const base = intentColors[intent] || intentColors.easy;
  
  if (kind === 'completed') {
    if (compliance === 'complete') {
      // Filled solid card
      return cn(base, 'border-2 bg-opacity-20');
    }
    if (compliance === 'partial') {
      // Dashed border with striped fill
      return cn(base, 'border-dashed border-2 bg-gradient-to-r from-transparent via-current/5 to-transparent');
    }
    if (compliance === 'missed') {
      return 'border-2 border-dashed border-destructive/40 bg-destructive/5';
    }
  }
  
  // Planned = outlined card
  return cn(base, 'border border-dashed');
}

export function TrainingCard({ group, variant = 'compact', onClick }: TrainingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const primaryItem = group.items[0];
  const Icon = sportIcons[primaryItem.sport];
  const isMultiple = group.count > 1;
  
  const handleClick = () => {
    if (isMultiple && !expanded) {
      setExpanded(true);
    } else if (onClick) {
      onClick(primaryItem);
    }
  };
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  if (variant === 'compact') {
    return (
      <div className="space-y-1">
        <button
          onClick={handleClick}
          className={cn(
            'w-full rounded-lg p-2 text-left transition-all hover:shadow-md',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            getCardStyles(primaryItem.kind, primaryItem.compliance, primaryItem.intent)
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', intentTextColors[primaryItem.intent])} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className={cn(
                  'text-xs font-medium truncate',
                  intentTextColors[primaryItem.intent]
                )}>
                  {intentLabels[primaryItem.intent] || primaryItem.intent}
                </span>
                
                {isMultiple && (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1">
                    ×{group.count}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <span>{primaryItem.durationMin}m</span>
                {primaryItem.secondary && (
                  <>
                    <span>•</span>
                    <span className="truncate">{primaryItem.secondary}</span>
                  </>
                )}
              </div>
            </div>
            
            {isMultiple && (
              <button
                onClick={handleToggleExpand}
                className="p-0.5 hover:bg-muted rounded"
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          
          {/* AM/PM labels */}
          {isMultiple && (group.hasAM || group.hasPM) && (
            <div className="flex gap-1 mt-1">
              {group.hasAM && (
                <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 rounded px-1">
                  AM
                </span>
              )}
              {group.hasPM && (
                <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 rounded px-1">
                  PM
                </span>
              )}
            </div>
          )}
        </button>
        
        {/* Expanded items */}
        {expanded && isMultiple && (
          <div className="pl-4 space-y-1">
            {group.items.slice(1).map((item) => (
              <button
                key={item.id}
                onClick={() => onClick?.(item)}
                className={cn(
                  'w-full rounded-lg p-1.5 text-left transition-all hover:shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  getCardStyles(item.kind, item.compliance, item.intent)
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-3 w-3 flex-shrink-0', intentTextColors[item.intent])} />
                  <span className="text-[10px] text-muted-foreground">
                    {item.durationMin}m
                    {item.secondary && ` • ${item.secondary}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Expanded variant (for week view)
  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        className={cn(
          'w-full rounded-xl p-3 text-left transition-all hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          getCardStyles(primaryItem.kind, primaryItem.compliance, primaryItem.intent)
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-background/80 shadow-sm'
          )}>
            <Icon className={cn('h-5 w-5', intentTextColors[primaryItem.intent])} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm font-semibold',
                intentTextColors[primaryItem.intent]
              )}>
                {intentLabels[primaryItem.intent] || primaryItem.intent}
              </span>
              
              {isMultiple && (
                <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  ×{group.count}
                </span>
              )}
              
              {primaryItem.kind === 'completed' && primaryItem.compliance === 'complete' && (
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                  ✓ Done
                </span>
              )}
            </div>
            
            {primaryItem.title && primaryItem.title !== intentLabels[primaryItem.intent] && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {primaryItem.title}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="font-medium">{primaryItem.durationMin} min</span>
              {primaryItem.secondary && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{primaryItem.secondary}</span>
                </>
              )}
              {primaryItem.load && primaryItem.load > 0 && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{Math.round(primaryItem.load)} TSS</span>
                </>
              )}
            </div>
            
            {/* AM/PM labels for multiple sessions */}
            {isMultiple && (
              <div className="flex gap-1.5 mt-2">
                {group.hasAM && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                    AM
                  </span>
                )}
                {group.hasPM && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                    PM
                  </span>
                )}
              </div>
            )}
          </div>
          
          {isMultiple && (
            <button
              onClick={handleToggleExpand}
              className="p-1 hover:bg-muted rounded-md"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </button>
      
      {/* Expanded items */}
      {expanded && isMultiple && (
        <div className="pl-6 space-y-2">
          {group.items.slice(1).map((item) => (
            <button
              key={item.id}
              onClick={() => onClick?.(item)}
              className={cn(
                'w-full rounded-lg p-2.5 text-left transition-all hover:shadow-md',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                getCardStyles(item.kind, item.compliance, item.intent)
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('h-4 w-4 flex-shrink-0', intentTextColors[item.intent])} />
                <div>
                  <span className={cn('text-xs font-medium', intentTextColors[item.intent])}>
                    {intentLabels[item.intent]}
                  </span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {item.durationMin}m
                    {item.secondary && ` • ${item.secondary}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
