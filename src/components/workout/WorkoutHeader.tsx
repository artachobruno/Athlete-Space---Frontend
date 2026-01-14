import { Footprints, Bike, Waves, Loader2, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUnitSystem } from '@/hooks/useUnitSystem'
import type { StructuredWorkoutResponse } from '@/api/workouts'

interface WorkoutHeaderProps {
  workout: StructuredWorkoutResponse['workout']
}

const sportIcons = {
  run: Footprints,
  ride: Bike,
  swim: Waves,
}

const sportLabels = {
  run: 'Running',
  ride: 'Cycling',
  swim: 'Swimming',
}

export function WorkoutHeader({ workout }: WorkoutHeaderProps) {
  const { convertDistance, formatDistance } = useUnitSystem()
  const SportIcon = sportIcons[workout.sport] || Footprints

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const parseStatusConfig = {
    pending: {
      icon: Loader2,
      label: 'Parsing...',
      variant: 'secondary' as const,
      className: 'animate-spin',
    },
    parsed: {
      icon: CheckCircle2,
      label: 'Parsed',
      variant: 'default' as const,
      className: 'text-green-600',
    },
    ambiguous: {
      icon: AlertTriangle,
      label: 'Approximate',
      variant: 'secondary' as const,
      className: 'text-yellow-600',
    },
    failed: {
      icon: HelpCircle,
      label: 'Unavailable',
      variant: 'outline' as const,
      className: 'text-gray-500',
    },
  }

  const statusConfig = parseStatusConfig[workout.parse_status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
          <SportIcon className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-primary">
              {sportLabels[workout.sport]}
            </h2>
            <Badge variant={statusConfig.variant} className="gap-1">
              <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {workout.total_distance_meters !== null && (
              <span>
                Distance: {formatDistance(convertDistance(workout.total_distance_meters / 1000))}
              </span>
            )}
            {workout.total_duration_seconds !== null && (
              <span>
                Duration: {formatDuration(workout.total_duration_seconds)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
