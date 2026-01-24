import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClimateInfoTooltipProps {
  detail: string;
}

/**
 * Info affordance for climate expectation detail.
 * Icon only; tap/hover reveals numeric context. No styling emphasis.
 */
export function ClimateInfoTooltip({ detail }: ClimateInfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex align-middle cursor-help ml-1 text-muted-foreground hover:text-foreground">
            <Info className="h-3 w-3" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {detail}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
