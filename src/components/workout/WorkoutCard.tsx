import { useMemo } from 'react';
import type { CalendarSession, ActivityStreamsResponse } from '@/lib/api';
import type { CompletedActivity } from '@/types';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { WorkoutCardSvg, type WorkoutCardVariant } from './WorkoutCardSvg';

export interface WorkoutCardProps {
  session: CalendarSession;
  activity?: CompletedActivity | null;
  streams?: ActivityStreamsResponse | null;
  tss?: number | null;
  variant?: WorkoutCardVariant;
  className?: string;
}

const formatDuration = (totalSeconds: number | null) => {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatPace = (paceMin: number, unit: string) => {
  const totalSeconds = Math.round(paceMin * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const suffix = unit === 'min/mi' ? '/mi' : '/km';
  return `${minutes}:${seconds.toString().padStart(2, '0')} ${suffix}`;
};

export function WorkoutCard({
  session,
  activity,
  streams,
  tss,
  variant = 'feed',
  className,
}: WorkoutCardProps) {
  const { convertDistance, convertPace } = useUnitSystem();
  const size = variant === 'share'
    ? { width: 1200, height: 630 }
    : variant === 'mobile'
      ? { width: 320, height: 220 }
      : { width: 600, height: 360 };

  const distanceKm = activity?.distance ?? session.distance_km ?? null;
  const durationSeconds = (activity?.duration ?? session.duration_minutes ?? 0) * 60 || null;

  const distanceLabel = useMemo(() => {
    if (!distanceKm || !Number.isFinite(distanceKm)) return null;
    const converted = convertDistance(distanceKm);
    return `${converted.value.toFixed(1)} ${converted.unit}`;
  }, [convertDistance, distanceKm]);

  const timeLabel = useMemo(() => formatDuration(durationSeconds), [durationSeconds]);

  const paceLabel = useMemo(() => {
    if (!distanceKm || !durationSeconds) return null;
    const paceMinPerKm = (durationSeconds / 60) / distanceKm;
    if (!Number.isFinite(paceMinPerKm)) return null;
    const converted = convertPace(paceMinPerKm);
    return formatPace(converted.value, converted.unit);
  }, [convertPace, distanceKm, durationSeconds]);

  const typeLabel = session.type || session.intensity || 'Workout';

  return (
    <div className={className} style={{ aspectRatio: `${size.width} / ${size.height}` }}>
      <WorkoutCardSvg
        title={session.title || typeLabel}
        distance={distanceLabel}
        time={timeLabel}
        pace={paceLabel}
        typeLabel={typeLabel}
        tss={tss ?? activity?.trainingLoad ?? null}
        routePoints={streams?.route_points as [number, number][] | null ?? null}
        paceStream={streams?.pace ?? null}
        elevationStream={streams?.elevation ?? null}
        variant={variant}
      />
    </div>
  );
}
