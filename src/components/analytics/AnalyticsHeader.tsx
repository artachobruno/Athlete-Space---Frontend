import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AnalyticsHeaderProps {
  isAdvanced: boolean;
  onToggleAdvanced: (value: boolean) => void;
  dateRange: 30 | 90;
  onDateRangeChange: (range: 30 | 90) => void;
}

export function AnalyticsHeader({
  isAdvanced,
  onToggleAdvanced,
  dateRange,
  onDateRangeChange,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Date Range */}
      <Tabs
        value={String(dateRange)}
        onValueChange={(v) => onDateRangeChange(Number(v) as 30 | 90)}
      >
        <TabsList>
          <TabsTrigger value="30">Last 30 Days</TabsTrigger>
          <TabsTrigger value="90">Last 90 Days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Advanced Toggle */}
      <div className="flex items-center gap-3">
        <Label
          htmlFor="advanced-toggle"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Simple
        </Label>
        <Switch
          id="advanced-toggle"
          checked={isAdvanced}
          onCheckedChange={onToggleAdvanced}
        />
        <Label
          htmlFor="advanced-toggle"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Advanced
        </Label>
      </div>
    </div>
  );
}
