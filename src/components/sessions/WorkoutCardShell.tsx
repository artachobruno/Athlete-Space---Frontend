import { cn } from '@/lib/utils';

interface WorkoutCardShellProps {
  children: React.ReactNode;
  highlighted?: boolean;
}

export function WorkoutCardShell({
  children,
  highlighted = false,
}: WorkoutCardShellProps) {
  return (
    <div
      className={cn(
        // Base glass card
        'relative rounded-xl border border-white/10 bg-gradient-to-b',
        'from-slate-900/80 to-slate-950/90',
        'backdrop-blur-md shadow-sm transition-all motion-safe:duration-200',

        // Hover
        'hover:shadow-lg hover:border-white/20',

        // Glow for key workouts
        highlighted &&
          'ring-1 ring-cyan-400/40 shadow-[0_0_24px_-12px_rgba(56,189,248,0.45)]'
      )}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />

      <div className="relative p-3">
        {children}
      </div>
    </div>
  );
}
