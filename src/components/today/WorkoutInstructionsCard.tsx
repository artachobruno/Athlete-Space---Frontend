import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface WorkoutInstructionsCardProps {
  instructions: string[];
  className?: string;
}

export function WorkoutInstructionsCard({ instructions, className }: WorkoutInstructionsCardProps) {
  if (!instructions || instructions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Execution Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {instructions.map((instruction, index) => (
            <li key={index} className="text-sm text-foreground flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
