import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, ArrowRight } from 'lucide-react';
import type { Sport } from '@/types';

interface CoachSummaryCardProps {
  data: {
    sports: Sport[];
    consistency: string;
    goal: string;
    availableDays: number;
    hoursPerWeek: number;
    hasInjury: boolean;
    stravaConnected: boolean;
  };
  onContinue: () => void;
}

export function CoachSummaryCard({ data, onContinue }: CoachSummaryCardProps) {
  const sportNames = data.sports.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');

  return (
    <div className="ml-12 mt-4">
      <Card className="border-accent/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-accent">Your Profile Summary</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sports</span>
              <span className="text-foreground font-medium">{sportNames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly availability</span>
              <span className="text-foreground font-medium">{data.availableDays} days, ~{data.hoursPerWeek} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Focus</span>
              <span className="text-foreground font-medium">{data.goal || 'General training'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data source</span>
              <span className="text-foreground font-medium">
                {data.stravaConnected ? 'Strava connected' : 'Conversation only'}
              </span>
            </div>
          </div>

          <Button onClick={onContinue} className="w-full mt-5">
            Start Training
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
