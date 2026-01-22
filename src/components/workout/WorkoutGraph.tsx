// ❗ DO NOT PARSE WORKOUTS FROM TEXT
// All workout structure must come from workout.steps
// Bar height should map to step intensity (recovery: 0.3, easy: 0.4, steady: 0.6, tempo: 0.75, interval: 1.0)
// Width = duration, Height = intensity intent

import { useMemo, useCallback, useRef, useEffect } from 'react'
import type { WorkoutTimeline, WorkoutTimelineSegment, WorkoutStreams } from '@/types/workoutTimeline'

/**
 * Maps step type/intensity to bar height (0.0 to 1.0)
 * Height = intent, width = duration
 */
function getIntensityHeight(stepType: string): number {
  const lower = stepType.toLowerCase();
  if (lower.includes('recovery') || lower.includes('cooldown') || lower.includes('warmup')) return 0.3;
  if (lower.includes('easy') || lower.includes('aerobic')) return 0.4;
  if (lower.includes('steady') || lower.includes('endurance')) return 0.6;
  if (lower.includes('tempo') || lower.includes('threshold') || lower.includes('lt2')) return 0.75;
  if (lower.includes('interval') || lower.includes('vo2') || lower.includes('hard')) return 1.0;
  return 0.5; // default
}

type WorkoutGraphProps = {
  timeline: WorkoutTimeline
  activeStepOrder: number | null
  onStepHover: (order: number | null) => void
  showActual?: boolean
}

function findSegmentForTime(segments: WorkoutTimelineSegment[], timeInSeconds: number): WorkoutTimelineSegment | null {
  return segments.find(seg => timeInSeconds >= seg.start_second && timeInSeconds <= seg.end_second) || null
}

function getStreamValues(streams?: WorkoutStreams): number[] {
  if (!streams) return []
  const values: number[] = []
  
  streams.hr?.forEach(v => { if (v !== null) values.push(v) })
  streams.pace?.forEach(v => { if (v !== null) values.push(v) })
  streams.power?.forEach(v => { if (v !== null) values.push(v) })
  
  return values
}

function getYDomain(
  segments: WorkoutTimelineSegment[], 
  streams?: WorkoutStreams,
  actualData?: Array<{ time_second: number; value: number }>
): [number, number] {
  const values: number[] = []
  
  segments.forEach(seg => {
    const { target } = seg
    if (target.min !== undefined) values.push(target.min)
    if (target.max !== undefined) values.push(target.max)
    if (target.value !== undefined) values.push(target.value)
  })

  // Include stream values in domain calculation
  values.push(...getStreamValues(streams))

  if (actualData) {
    actualData.forEach(point => {
      values.push(point.value)
    })
  }
  
  if (values.length === 0) return [0, 100]
  
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.1 || 10
  
  return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)]
}

export function WorkoutGraph({ timeline, activeStepOrder, onStepHover, showActual = false }: WorkoutGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const sortedSegments = useMemo(() => {
    return [...timeline.segments].sort((a, b) => a.order - b.order)
  }, [timeline.segments])

  const activeSegment = useMemo(() => {
    if (activeStepOrder === null) return null
    return sortedSegments.find(seg => seg.order === activeStepOrder) || null
  }, [activeStepOrder, sortedSegments])
  
  useEffect(() => {
    if (activeStepOrder !== null && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeStepOrder])

  const yDomain = useMemo(() => {
    return getYDomain(
      sortedSegments, 
      showActual ? timeline.streams : undefined,
      showActual ? timeline.actual_data : undefined
    )
  }, [sortedSegments, showActual, timeline.streams, timeline.actual_data])

  const [yMin, yMax] = yDomain
  const yRange = yMax - yMin
  const totalDuration = timeline.total_duration_seconds

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width - 80
    const timeInSeconds = (x / width) * totalDuration
    
    if (timeInSeconds >= 0 && timeInSeconds <= totalDuration) {
      const segment = findSegmentForTime(sortedSegments, timeInSeconds)
      onStepHover(segment?.order ?? null)
    } else {
      onStepHover(null)
    }
  }, [sortedSegments, onStepHover, totalDuration])

  const handleMouseLeave = useCallback(() => {
    onStepHover(null)
  }, [onStepHover])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const getX = (seconds: number, width: number): number => {
    return (seconds / totalDuration) * width
  }

  const getY = (value: number, height: number): number => {
    return height - ((value - yMin) / yRange) * height
  }

  const ticks = useMemo(() => {
    const timeTicks: number[] = []
    const interval = totalDuration / 6
    for (let i = 0; i <= 6; i++) {
      timeTicks.push(i * interval)
    }
    
    const valueTicks: number[] = []
    const valueInterval = yRange / 5
    for (let i = 0; i <= 5; i++) {
      valueTicks.push(yMin + i * valueInterval)
    }
    
    return { timeTicks, valueTicks }
  }, [totalDuration, yRange, yMin])

  const fadeMaskRects = useMemo(() => {
    if (!showActual || !activeSegment) return null
    const chartWidth = 720
    const chartLeft = 40
    const startX = getX(activeSegment.start_second, chartWidth) + chartLeft
    const endX = getX(activeSegment.end_second, chartWidth) + chartLeft
    return { startX, endX, chartLeft, chartRight: 760 }
  }, [showActual, activeSegment, totalDuration])

  return (
    <div ref={containerRef} className="w-full h-64 border rounded-lg p-4 bg-card">
      <svg
        ref={svgRef}
        viewBox="0 0 800 200"
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={(e) => {
          if (!svgRef.current) return
          const touch = e.touches[0]
          const rect = svgRef.current.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const width = rect.width - 80
          const timeInSeconds = (x / width) * totalDuration
          
          if (timeInSeconds >= 0 && timeInSeconds <= totalDuration) {
            const segment = findSegmentForTime(sortedSegments, timeInSeconds)
            onStepHover(segment?.order ?? null)
          }
        }}
        onTouchEnd={handleMouseLeave}
      >
        <defs>
          <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="bandGradientActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
          </linearGradient>
          {showActual && fadeMaskRects && (
            <mask id="fadeMask">
              <rect x="0" y="0" width="800" height="200" fill="white" />
              <rect x="0" y="0" width={fadeMaskRects.startX} height="200" fill="rgb(178, 178, 178)" />
              <rect x={fadeMaskRects.endX} y="0" width={fadeMaskRects.chartRight - fadeMaskRects.endX} height="200" fill="rgb(178, 178, 178)" />
            </mask>
          )}
        </defs>
        
        {/* Grid lines */}
        <g stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5}>
          {ticks.timeTicks.map((tick, i) => {
            const x = getX(tick, 720) + 40
            if (i === 0 || i === ticks.timeTicks.length - 1) return null
            return <line key={`v-${i}`} x1={x} y1={10} x2={x} y2={190} />
          })}
          {ticks.valueTicks.map((tick, i) => {
            const y = getY(tick, 180) + 10
            if (i === 0 || i === ticks.valueTicks.length - 1) return null
            return <line key={`h-${i}`} x1={40} y1={y} x2={760} y2={y} />
          })}
        </g>

        {/* Y-axis */}
        <line x1="40" y1="10" x2="40" y2="190" stroke="hsl(var(--border))" strokeWidth="1" />
        {ticks.valueTicks.map((tick, i) => {
          const y = getY(tick, 180) + 10
          return (
            <g key={`y-tick-${i}`}>
              <line x1="40" y1={y} x2="45" y2={y} stroke="hsl(var(--border))" strokeWidth="1" />
              <text
                x="35"
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="hsl(var(--muted-foreground))"
              >
                {Math.round(tick)}
              </text>
            </g>
          )
        })}

        {/* X-axis */}
        <line x1="40" y1="190" x2="760" y2="190" stroke="hsl(var(--border))" strokeWidth="1" />
        {ticks.timeTicks.map((tick, i) => {
          const x = getX(tick, 720) + 40
          return (
            <g key={`x-tick-${i}`}>
              <line x1={x} y1="190" x2={x} y2="195" stroke="hsl(var(--border))" strokeWidth="1" />
              <text
                x={x}
                y="205"
                textAnchor="middle"
                fontSize="11"
                fill="hsl(var(--muted-foreground))"
              >
                {formatTime(tick)}
              </text>
            </g>
          )
        })}

        {/* Stream data traces */}
        {showActual && timeline.streams && (
          <g>
            {/* HR stream - red */}
            {timeline.streams.hr && timeline.streams.hr.some(v => v !== null) && (
              <polyline
                points={timeline.streams.time
                  .map((t, i) => {
                    const val = timeline.streams!.hr![i]
                    if (val === null) return null
                    return `${getX(t, 720) + 40},${getY(val, 180) + 10}`
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="hsl(0 84% 60%)"
                strokeWidth="1.5"
                opacity={activeSegment ? 0.9 : 0.6}
                mask={activeSegment ? "url(#fadeMask)" : undefined}
              />
            )}
            {/* Pace stream - blue */}
            {timeline.streams.pace && timeline.streams.pace.some(v => v !== null) && (
              <polyline
                points={timeline.streams.time
                  .map((t, i) => {
                    const val = timeline.streams!.pace![i]
                    if (val === null) return null
                    return `${getX(t, 720) + 40},${getY(val, 180) + 10}`
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="hsl(217 91% 60%)"
                strokeWidth="1.5"
                opacity={activeSegment ? 0.9 : 0.6}
                mask={activeSegment ? "url(#fadeMask)" : undefined}
              />
            )}
            {/* Power stream - orange */}
            {timeline.streams.power && timeline.streams.power.some(v => v !== null) && (
              <polyline
                points={timeline.streams.time
                  .map((t, i) => {
                    const val = timeline.streams!.power![i]
                    if (val === null) return null
                    return `${getX(t, 720) + 40},${getY(val, 180) + 10}`
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="hsl(25 95% 53%)"
                strokeWidth="1.5"
                opacity={activeSegment ? 0.9 : 0.6}
                mask={activeSegment ? "url(#fadeMask)" : undefined}
              />
            )}
          </g>
        )}

        {/* Legacy actual data trace (fallback) */}
        {showActual && !timeline.streams && timeline.actual_data && timeline.actual_data.length > 0 && (
          <g>
            <polyline
              points={timeline.actual_data
                .map(point => `${getX(point.time_second, 720) + 40},${getY(point.value, 180) + 10}`)
                .join(' ')}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
              opacity={activeSegment ? 0.8 : 0.4}
              mask={activeSegment ? "url(#fadeMask)" : undefined}
            />
          </g>
        )}

        {/* Segments - rendered as intensity-aware bars (height = intensity, width = duration) */}
        {sortedSegments.map((seg) => {
          const isActive = activeStepOrder === seg.order
          const opacity = isActive ? 1 : 0.4
          const strokeWidth = isActive ? 2 : 1
          const x1 = getX(seg.start_second, 720) + 40
          const x2 = getX(seg.end_second, 720) + 40
          const width = x2 - x1

          // Map step type to intensity height (0.0 to 1.0)
          const intensityHeight = getIntensityHeight(seg.step_type)
          const maxBarHeight = 180 // Maximum bar height in pixels
          const barHeight = maxBarHeight * intensityHeight
          const y1 = 10 + (maxBarHeight - barHeight) // Bottom-aligned bars
          const y2 = 10 + maxBarHeight

          // Render intensity-based bar
          return (
            <g key={`segment-${seg.order}`}>
              <rect
                x={x1}
                y={y1}
                width={width}
                height={barHeight}
                fill={isActive ? "url(#bandGradientActive)" : "url(#bandGradient)"}
                fillOpacity={opacity}
                stroke="hsl(var(--primary))"
                strokeWidth={strokeWidth}
                rx={2}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
