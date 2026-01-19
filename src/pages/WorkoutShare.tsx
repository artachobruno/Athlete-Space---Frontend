import { useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import { WorkoutCardSvg } from '@/components/workout/WorkoutCardSvg';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { fetchActivities, fetchActivityStreams } from '@/lib/api';
import type { CompletedActivity } from '@/types';

const SPORT_LABELS: Record<string, string> = {
  run: 'Run',
  ride: 'Ride',
  swim: 'Swim',
};

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

export default function WorkoutShare() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [searchParams] = useSearchParams();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { convertDistance, convertPace } = useUnitSystem();
  const state = useStructuredWorkout(workoutId);

  const queryOverride = useMemo(() => ({
    title: searchParams.get('title'),
    distance: searchParams.get('distance'),
    time: searchParams.get('time'),
    pace: searchParams.get('pace'),
    type: searchParams.get('type'),
    tss: searchParams.get('tss'),
    activityId: searchParams.get('activityId'),
  }), [searchParams]);

  const { data: activities } = useAuthenticatedQuery<CompletedActivity[]>({
    queryKey: ['activities', 'share', workoutId],
    queryFn: () => fetchActivities({ limit: 200 }),
    retry: 1,
    enabled: Boolean(workoutId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const matchedActivity = useMemo(() => {
    if (!activities || !workoutId) return null;
    return activities.find(activity => activity.workout_id === workoutId) || null;
  }, [activities, workoutId]);

  const activityId = queryOverride.activityId || matchedActivity?.id || null;

  const { data: activityStreams } = useAuthenticatedQuery({
    queryKey: ['activityStreams', 'share', activityId],
    queryFn: () => fetchActivityStreams(activityId as string),
    retry: 1,
    enabled: Boolean(activityId),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const cardData = useMemo(() => {
    if (state.status !== 'ready') {
      if (queryOverride.title || queryOverride.distance || queryOverride.time || queryOverride.pace) {
        return {
          title: queryOverride.title ?? 'Workout',
          distance: queryOverride.distance ?? null,
          time: queryOverride.time ?? null,
          pace: queryOverride.pace ?? null,
          typeLabel: queryOverride.type ?? 'Workout',
          tss: queryOverride.tss ?? null,
        };
      }
      return null;
    }

    const { workout } = state.data;
    const sportLabel = SPORT_LABELS[workout.sport] ?? 'Workout';
    const distanceKm = workout.total_distance_meters ? workout.total_distance_meters / 1000 : null;
    const durationSeconds = workout.total_duration_seconds ?? null;
    const distanceLabel = distanceKm
      ? (() => {
          const converted = convertDistance(distanceKm);
          return `${converted.value.toFixed(1)} ${converted.unit}`;
        })()
      : null;

    const timeLabel = formatDuration(durationSeconds);
    const paceLabel = distanceKm && durationSeconds
      ? (() => {
          const paceMinPerKm = (durationSeconds / 60) / distanceKm;
          const converted = convertPace(paceMinPerKm);
          return formatPace(converted.value, converted.unit);
        })()
      : null;

    return {
      title: queryOverride.title ?? sportLabel,
      distance: queryOverride.distance ?? distanceLabel,
      time: queryOverride.time ?? timeLabel,
      pace: queryOverride.pace ?? paceLabel,
      typeLabel: queryOverride.type ?? sportLabel,
      tss: queryOverride.tss ?? null,
    };
  }, [queryOverride, state, convertDistance, convertPace]);

  const downloadPng = async () => {
    if (!svgRef.current || !cardData) return;
    setIsExporting(true);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        setIsExporting(false);
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(url);
          setIsExporting(false);
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${workoutId || 'workout'}-share.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setIsExporting(false);
    };
    image.src = url;
  };

  if (state.status === 'loading' && !cardData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (state.status === 'error' && !cardData) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load workout</p>
          <p className="text-xs mt-2">{state.error}</p>
        </div>
      </AppLayout>
    );
  }

  if (!cardData) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">No workout data available.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center gap-6 py-10">
      <div className="w-full max-w-5xl">
        <WorkoutCardSvg
          title={cardData.title}
          distance={cardData.distance}
          time={cardData.time}
          pace={cardData.pace}
          typeLabel={cardData.typeLabel}
          tss={cardData.tss}
          routePoints={activityStreams?.route_points ?? null}
          paceStream={activityStreams?.pace ?? null}
          elevationStream={activityStreams?.elevation ?? null}
          variant="share"
          svgRef={svgRef}
        />
      </div>
        <Button onClick={downloadPng} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
