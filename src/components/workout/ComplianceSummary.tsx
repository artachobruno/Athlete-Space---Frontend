type ComplianceSummaryProps = {
  overallCompliancePercent: number | null
  totalPausedSeconds: number | null
}

function formatPausedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function ComplianceSummary({ overallCompliancePercent, totalPausedSeconds }: ComplianceSummaryProps) {
  if (overallCompliancePercent === null && totalPausedSeconds === null) {
    return null
  }

  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        {overallCompliancePercent !== null && (
          <div>
            <div className="text-sm text-muted-foreground">Overall Compliance</div>
            <div className="text-2xl font-semibold text-foreground">
              {Math.round(overallCompliancePercent)}%
            </div>
          </div>
        )}
        {totalPausedSeconds !== null && totalPausedSeconds > 0 && (
          <div>
            <div className="text-sm text-muted-foreground">Total Paused</div>
            <div className="text-2xl font-semibold text-foreground">
              {formatPausedTime(totalPausedSeconds)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}