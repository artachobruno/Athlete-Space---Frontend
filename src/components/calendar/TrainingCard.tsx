import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
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

// Minimal sport indicator dot colors
const sportDotColors: Record<CalendarSport, string> = {
  run: 'bg-accent',
  ride: 'bg-chart-2',
  swim: 'bg-chart-1',
  strength: 'bg-chart-5',
  race: 'bg-destructive',
  other: 'bg-muted-foreground',
};

const intentLabels: Record<string, string> = {
  easy: 'EASY',
  steady: 'STEADY',
  tempo: 'TEMPO',
  intervals: 'INT',
  long: 'LONG',
  rest: 'REST',
};

// Telemetry-style: thin borders, no background fills
const intentBorders: Record<string, string> = {
  easy: 'border-load-fresh/40',
  steady: 'border-accent/40',
  tempo: 'border-load-overreaching/40',
  intervals: 'border-destructive/40',
  long: 'border-chart-5/40',
  rest: 'border-border',
};

const intentTextColors: Record<string, string> = {
  easy: 'text-load-fresh',
  steady: 'text-accent',
  tempo: 'text-load-overreaching',
  intervals: 'text-destructive',
  long: 'text-chart-5',
  rest: 'text-muted-foreground',
};

function getCardStyles(
  kind: 'planned' | 'completed',
  compliance: CalendarCompliance | undefined,
  intent: string
): string {
  const borderStyle = intentBorders[intent] || intentBorders.easy;
  
  if (kind === 'completed') {
    if (compliance === 'complete') {
      // Solid thin border - completed
      return cn(borderStyle, 'border bg-card/50');
    }
    if (compliance === 'partial') {
      // Dashed border - partial
      return cn(borderStyle, 'border-dashed border bg-transparent');
    }
    if (compliance === 'missed') {
      return 'border border-dashed border-destructive/30 bg-transparent';
    }
  }
  
  // Planned = dashed outline, no fill
  return cn(borderStyle, 'border border-dashed bg-transparent');
}

// Minimal sport dot SVG
function SportDot({ sport }: { sport: CalendarSport }) {
  const colorClass = sportDotColors[sport] || sportDotColors.other;
  return (
    <span className={cn('inline-block w-1.5 h-1.5 rounded-full', colorClass)} />
  );
}

export function TrainingCard({ group, variant = 'compact', onClick }: TrainingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const primaryItem = group.items[0];
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
      <div className="space-y-0.5">
        <button
          onClick={handleClick}
          className={cn(
            'w-full rounded-md px-2 py-1.5 text-left transition-colors',
            'focus:outline-none focus:ring-1 focus:ring-primary/20',
            'border-l-2 border-t-0 border-r-0 border-b-0',
            getCardStyles(primaryItem.kind, primaryItem.compliance, primaryItem.intent)
          )}
        >
          {/* Telemetry hierarchy: Label → Duration → Metadata */}
          <div className="flex flex-col gap-0.5">
            {/* Session type label - small caps, muted */}
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-[9px] font-medium uppercase tracking-wider',
                'text-muted-foreground/70'
              )}>
                {intentLabels[primaryItem.intent] || primaryItem.intent}
              </span>
              
              {isMultiple && (
                <span className="text-[9px] font-mono text-muted-foreground/50">
                  ×{group.count}
                </span>
              )}
            </div>
            
            {/* Duration - DOMINANT metric */}
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold tabular-nums tracking-tight text-foreground">
                {primaryItem.durationMin}
              </span>
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">min</span>
              
              {primaryItem.secondary && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="text-[10px] text-muted-foreground/60 truncate tabular-nums">
                    {primaryItem.secondary}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {isMultiple && (
            <button
              onClick={handleToggleExpand}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted/50 rounded"
            >
              {expanded ? (
                <ChevronUp className="h-2.5 w-2.5 text-muted-foreground/50" />
              ) : (
                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/50" />
              )}
            </button>
          )}
        </button>
        
        {/* Expanded items - telemetry rows */}
        {expanded && isMultiple && (
          <div className="pl-3 space-y-0.5 border-l border-muted/30 ml-1">
            {group.items.slice(1).map((item) => (
              <button
                key={item.id}
                onClick={() => onClick?.(item)}
                className={cn(
                  'w-full rounded px-1.5 py-1 text-left transition-colors',
                  'focus:outline-none focus:ring-1 focus:ring-primary/20',
                  'hover:bg-muted/30'
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium tabular-nums text-foreground/80">
                    {item.durationMin}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50 uppercase">min</span>
                  {item.secondary && (
                    <span className="text-[9px] text-muted-foreground/50 truncate">
                      {item.secondary}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Expanded variant (for week view) - Telemetry style
  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        className={cn(
          'w-full rounded-md px-3 py-2 text-left transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-primary/20',
          'border-l-2 border-t-0 border-r-0 border-b-0',
          getCardStyles(primaryItem.kind, primaryItem.compliance, primaryItem.intent)
        )}
      >
        <div className="flex flex-col gap-1">
          {/* Session type - small caps label */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              {intentLabels[primaryItem.intent] || primaryItem.intent}
            </span>
            
            <div className="flex items-center gap-1.5">
              {isMultiple && (
                <span className="text-[9px] font-mono text-muted-foreground/50">×{group.count}</span>
              )}
              
              {primaryItem.kind === 'completed' && primaryItem.compliance === 'complete' && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-load-fresh/70">
                  ✓
                </span>
              )}
              
              {primaryItem.kind === 'planned' && primaryItem.compliance === 'missed' && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-destructive/70">
                  MISS
                </span>
              )}
            </div>
          </div>
          
          {/* Duration - DOMINANT */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
              {primaryItem.durationMin}
            </span>
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">min</span>
          </div>
          
          {/* Title if different from intent */}
          {primaryItem.title && primaryItem.title !== intentLabels[primaryItem.intent] && (
            <p className="text-[11px] text-muted-foreground/70 line-clamp-1 tracking-tight">
              {primaryItem.title}
            </p>
          )}
          
          {/* Metrics row - telemetry style */}
          <div className="flex items-center gap-3 text-[10px] tabular-nums">
            {primaryItem.secondary && (
              <span className="text-muted-foreground/60">{primaryItem.secondary}</span>
            )}
            {primaryItem.load && primaryItem.load > 0 && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="text-muted-foreground/60">{Math.round(primaryItem.load)} TSS</span>
              </>
            )}
          </div>
        </div>
        
        {isMultiple && (
          <button
            onClick={handleToggleExpand}
            className="absolute right-2 top-2 p-0.5 hover:bg-muted/50 rounded"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground/40" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
            )}
          </button>
        )}
      </button>
      
      {/* Expanded items - telemetry rows */}
      {expanded && isMultiple && (
        <div className="pl-3 space-y-0.5 border-l border-muted/20 ml-1">
          {group.items.slice(1).map((item) => (
            <button
              key={item.id}
              onClick={() => onClick?.(item)}
              className={cn(
                'w-full rounded px-2 py-1.5 text-left transition-colors',
                'focus:outline-none focus:ring-1 focus:ring-primary/20',
                'hover:bg-muted/20'
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-base font-medium tabular-nums text-foreground/80">
                  {item.durationMin}
                </span>
                <span className="text-[9px] text-muted-foreground/40 uppercase">min</span>
                {item.secondary && (
                  <>
                    <span className="text-muted-foreground/20">|</span>
                    <span className="text-[10px] text-muted-foreground/50">{item.secondary}</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
