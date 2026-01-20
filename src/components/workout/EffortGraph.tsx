/**
 * EffortGraph
 *
 * Compact bar chart visualization of workout effort distribution.
 * Used in WorkoutSessionCard for scannability across all views.
 *
 * Features:
 * - Planned bars (faint baseline reference)
 * - Actual bars (brighter, with peak highlight)
 * - Compliance mode: overlays planned vs actual
 * - No labels, no axes, no animations (per design spec)
 */

import { cn } from '@/lib/utils';

interface EffortGraphProps {
  /** Actual effort data points (normalized 0-10 scale) */
  data: number[];
  /** Whether to show actual data (completed/compliance) or muted (planned only) */
  showData: boolean;
  /** Planned effort data for compliance comparison */
  plannedData?: number[];
  /** Whether in compliance mode (shows both planned and actual) */
  isCompliance?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function EffortGraph({
  data,
  showData,
  plannedData,
  isCompliance = false,
  className,
}: EffortGraphProps) {
  const maxEffort = data.length > 0 ? Math.max(...data) : 10;
  const peakIndex = data.indexOf(maxEffort);

  return (
    <div
      className={cn(
        'relative mx-3 mb-3 rounded-lg overflow-hidden',
        className
      )}
      style={{
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Dark inset background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--background))] opacity-80" />

      {/* Dark mode specific styling */}
      <div className="dark:absolute dark:inset-0 dark:bg-gradient-to-b dark:from-[#0d141d] dark:to-[#10171f] dark:border-t dark:border-[hsl(var(--border))]" />

      {/* Baseline reference */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[hsl(var(--border))] opacity-50" />

      {/* Bars container */}
      <div className="relative h-9 flex items-end gap-[2px] px-1.5 py-1.5">
        {data.map((value, index) => {
          const heightPercent = (value / maxEffort) * 100;
          const isPeak = index === peakIndex && showData;

          // For compliance view, get planned height
          const plannedMax = plannedData && plannedData.length > 0 ? Math.max(...plannedData) : 1;
          const plannedHeight = plannedData && plannedData[index]
            ? (plannedData[index] / plannedMax) * 100
            : 0;

          return (
            <div
              key={index}
              className="flex-1 flex items-end justify-center relative"
            >
              {/* Planned bars (reference plane) - only in compliance */}
              {isCompliance && plannedData && (
                <div
                  className="absolute bottom-0 w-full rounded-[2px]"
                  style={{
                    height: `${plannedHeight}%`,
                    backgroundColor: 'hsl(var(--muted-foreground))',
                    opacity: 0.25,
                  }}
                />
              )}

              {/* Actual bars */}
              <div
                className="w-full relative rounded-[2px]"
                style={{
                  height: showData ? `${heightPercent}%` : '26%',
                  backgroundColor: isPeak
                    ? 'hsl(var(--foreground))'
                    : 'hsl(var(--muted-foreground))',
                  opacity: showData ? 0.9 : 0.24,
                  boxShadow: showData
                    ? isPeak
                      ? '0 0 0 1px hsla(var(--foreground), 0.2), inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.2)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 1px rgba(0,0,0,0.15)'
                    : 'none',
                }}
              >
                {/* Peak tick highlight */}
                {isPeak && (
                  <div
                    className="absolute -top-[2px] left-0 right-0 h-[2px] rounded-t-[2px]"
                    style={{
                      background:
                        'linear-gradient(to bottom, hsla(var(--foreground), 0.7), transparent)',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
