type CoachSummaryProps = {
  verdict?: string | null
  summary?: string | null
  confidence?: number | null
}

function getConfidenceLabel(confidence: number | null | undefined): string | null {
  if (confidence === null || confidence === undefined) return null
  if (confidence >= 0.8) return 'High'
  if (confidence >= 0.5) return 'Medium'
  return 'Low'
}

function limitToThreeLines(text: string): string {
  const lines = text.split('\n')
  if (lines.length <= 3) return text
  return lines.slice(0, 3).join('\n')
}

export function CoachSummary({ verdict, summary, confidence }: CoachSummaryProps) {
  const hasData = verdict || summary
  const confidenceLabel = getConfidenceLabel(confidence)

  if (!hasData) {
    return null
  }

  const displaySummary = summary ? limitToThreeLines(summary) : null

  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      {verdict && (
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Coach Verdict</div>
          <div className="text-lg font-semibold text-foreground">{verdict}</div>
        </div>
      )}

      {displaySummary && (
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Summary</div>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {displaySummary}
          </div>
        </div>
      )}

      {confidenceLabel && (
        <div className="text-xs text-muted-foreground">
          Coach confidence: {confidenceLabel}
        </div>
      )}
    </div>
  )
}
