import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Risk {
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface RiskListProps {
  risks: Risk[];
}

/**
 * Risk signals list for Coach Dashboard
 * Shows awareness items - no actions, just information
 */
export function RiskList({ risks }: RiskListProps) {
  const getIcon = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-load-fresh" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPrefix = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  return (
    <GlassCard className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Risk Signals</CardTitle>
        <p className="text-xs text-muted-foreground">Awareness items for coach review</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-2">
          {risks.map((risk, index) => (
            <li
              key={index}
              className={cn(
                'flex items-start gap-3 text-sm py-2 px-3 rounded-md',
                risk.type === 'success' && 'bg-load-fresh/10',
                risk.type === 'warning' && 'bg-yellow-500/10',
                risk.type === 'info' && 'bg-blue-500/10'
              )}
            >
              {getIcon(risk.type)}
              <span className="text-foreground">{risk.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </GlassCard>
  );
}
