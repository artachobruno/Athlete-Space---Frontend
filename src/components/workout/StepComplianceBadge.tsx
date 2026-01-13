import { cn } from '@/lib/utils'

type StepComplianceBadgeProps = {
  compliancePercent: number | null
  stepType: string
}

function getComplianceColor(percent: number | null): string {
  if (percent === null) return 'bg-muted text-muted-foreground'
  if (percent >= 80) return 'bg-green-500/20 text-green-600 border-green-500/30'
  if (percent >= 60) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
  return 'bg-red-500/20 text-red-600 border-red-500/30'
}

function getComplianceLabel(percent: number | null): string {
  if (percent === null) return 'N/A'
  if (percent >= 80) return 'OK'
  return `${Math.round(percent)}% in range`
}

export function StepComplianceBadge({ compliancePercent, stepType }: StepComplianceBadgeProps) {
  if (compliancePercent === null) {
    return null
  }

  return (
    <div className={cn('inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium', getComplianceColor(compliancePercent))}>
      <span className="capitalize mr-1.5">{stepType}</span>
      <span>—</span>
      <span className="ml-1.5">{getComplianceLabel(compliancePercent)}</span>
    </div>
  )
}