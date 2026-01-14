import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, AlertCircle } from 'lucide-react'
import type { StructuredWorkoutResponse } from '@/api/workouts'

interface ParseStatusBannerProps {
  parseStatus: StructuredWorkoutResponse['workout']['parse_status']
}

export function ParseStatusBanner({ parseStatus }: ParseStatusBannerProps) {
  if (parseStatus === 'parsed' || !parseStatus) {
    return null
  }

  const config = {
    pending: {
      icon: Loader2,
      message: 'Generating structured steps…',
      variant: 'default' as const,
    },
    ambiguous: {
      icon: AlertTriangle,
      message: 'Some steps may be approximate',
      variant: 'default' as const,
    },
    failed: {
      icon: AlertCircle,
      message: 'Structured steps unavailable. Raw notes used.',
      variant: 'destructive' as const,
    },
  }

  const statusConfig = config[parseStatus] || config.failed
  const Icon = statusConfig?.icon || AlertCircle

  return (
    <Alert variant={statusConfig.variant}>
      <Icon className={`h-4 w-4 ${parseStatus === 'pending' ? 'animate-spin' : ''}`} />
      <AlertDescription>{statusConfig.message}</AlertDescription>
    </Alert>
  )
}
