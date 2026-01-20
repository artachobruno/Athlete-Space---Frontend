import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Risk {
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface RiskListProps {
  risks: Risk[];
}

// F1 Design: Map risk types to F1 status - flat, clear, ruthless
type RiskType = 'success' | 'warning' | 'info';

const riskToIconClass: Record<RiskType, string> = {
  success: 'f1-status-safe',
  warning: 'f1-status-caution',
  info: 'f1-status-active',
};

const riskToBgClass: Record<RiskType, string> = {
  success: 'f1-status-safe-bg',
  warning: 'f1-status-caution-bg',
  info: 'f1-status-active-bg',
};

const riskToBorderClass: Record<RiskType, string> = {
  success: 'border-l-[hsl(var(--accent-success))]',
  warning: 'border-l-[hsl(var(--accent-warning))]',
  info: 'border-l-[hsl(var(--accent-telemetry))]',
};

/**
 * Risk signals list for Coach Dashboard
 * F1 Design: Flat status colors, impossible to miss
 * Shows awareness items - no actions, just information
 */
export function RiskList({ risks }: RiskListProps) {
  const getIcon = (type: RiskType) => {
    const iconClass = cn('h-4 w-4 shrink-0', riskToIconClass[type]);
    switch (type) {
      case 'success':
        return <CheckCircle2 className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        return <AlertOctagon className={iconClass} />;
    }
  };

  return (
    <F1Card>
      <F1CardHeader>
        <div>
          <F1CardTitle>Risk Signals</F1CardTitle>
          <F1CardLabel className="mt-1 block">Awareness items for coach review</F1CardLabel>
        </div>
      </F1CardHeader>
      
      <ul className="space-y-2">
        {risks.map((risk, index) => (
          <li
            key={index}
            className={cn(
              'flex items-start gap-3 py-3 px-3 rounded-f1 border-l-2',
              riskToBgClass[risk.type],
              riskToBorderClass[risk.type]
            )}
          >
            {getIcon(risk.type)}
            <span className="f1-body text-[hsl(var(--f1-text-primary))]">{risk.message}</span>
          </li>
        ))}
      </ul>
    </F1Card>
  );
}
