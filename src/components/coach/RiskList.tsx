import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Risk {
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface RiskListProps {
  risks: Risk[];
}

type RiskType = 'success' | 'warning' | 'info';

const riskToIconClass: Record<RiskType, string> = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const riskToBgClass: Record<RiskType, string> = {
  success: 'bg-green-500/10',
  warning: 'bg-amber-500/10',
  info: 'bg-blue-500/10',
};

const riskToBorderClass: Record<RiskType, string> = {
  success: 'border-l-green-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

/**
 * Risk signals list for Coach Dashboard
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Risk Signals</CardTitle>
        <CardDescription>Awareness items for coach review</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {risks.map((risk, index) => (
            <li
              key={index}
              className={cn(
                'flex items-start gap-3 py-3 px-3 rounded-lg border-l-2',
                riskToBgClass[risk.type],
                riskToBorderClass[risk.type]
              )}
            >
              {getIcon(risk.type)}
              <span className="text-sm">{risk.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
