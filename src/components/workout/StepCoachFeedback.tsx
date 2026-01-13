import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepCoachFeedbackProps = {
  compliancePercent: number | null
  stepType: string
  feedback?: string | null
  tip?: string | null
}

export function StepCoachFeedback({
  compliancePercent,
  stepType,
  feedback,
  tip,
}: StepCoachFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasFeedback = feedback || tip

  if (!hasFeedback) {
    return null
  }

  const complianceLabel =
    compliancePercent !== null ? `${Math.round(compliancePercent)}% in range` : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          'w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors',
          'flex items-center justify-between gap-2 py-1.5'
        )}
      >
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="capitalize font-medium">{stepType}</span>
          {complianceLabel && <span>— {complianceLabel}</span>}
          {feedback && (
            <>
              <span className="text-xs">Coach:</span>
              <span className="italic">
                {feedback.length > 40 ? `${feedback.substring(0, 40)}...` : feedback}
              </span>
            </>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200 flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-1 space-y-2">
        {feedback && (
          <div className="text-sm text-foreground">
            <span className="font-medium">Coach: </span>
            <span>{feedback}</span>
          </div>
        )}
        {tip && (
          <div className="text-sm text-foreground">
            <span className="font-medium">Tip: </span>
            <span>{tip}</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
