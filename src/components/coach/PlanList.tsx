import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlanItem } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PlanListProps {
  planItems: PlanItem[];
}

export function PlanList({ planItems }: PlanListProps) {
  if (!planItems || planItems.length === 0) {
    return null;
  }

  return (
    <GlassCard className="mt-4 border-accent/20 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Training Plan</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2" role="list">
          {planItems.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex flex-col gap-1 rounded-md p-3 text-sm',
                'bg-card border border-border/50'
              )}
            >
              <div className="font-medium text-foreground">{item.title}</div>
              {item.description && (
                <div className="text-muted-foreground">{item.description}</div>
              )}
              {item.date && (
                <div className="text-xs text-muted-foreground mt-1">
                  {item.date}
                </div>
              )}
              {item.sport && (
                <div className="text-xs text-muted-foreground">
                  {item.sport}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </GlassCard>
  );
}
