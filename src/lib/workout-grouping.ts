import type { WorkoutStep } from '@/lib/api';
import type { StructuredWorkoutStep } from '@/api/workouts';

interface StepLike {
  name: string;
  distance_km?: number | null;
  distance_meters?: number | null;
  duration_min?: number | null;
  duration_seconds?: number | null;
  intensity?: string | null;
  notes?: string | null;
}

export interface GroupedStep {
  name: string;
  count: number;
  totalDistanceKm: number | null;
  durationMin: number | null;
  intensity: string | null;
  notes: string | null;
  isRepeat: boolean;
  repeatSteps?: Array<{ name: string; durationMin: number | null; distanceKm: number | null; intensity: string | null }>;
}

export function normalizeStepName(name: string): string {
  // Remove trailing numbers and whitespace (e.g., "Stride 1" -> "Stride", "Stride 2" -> "Stride")
  return name.replace(/\s+\d+$/, '').trim();
}

function getStepDistance(step: StepLike): number | null {
  if (step.distance_km !== null && step.distance_km !== undefined) {
    return step.distance_km;
  }
  if (step.distance_meters !== null && step.distance_meters !== undefined) {
    return step.distance_meters / 1000;
  }
  return null;
}

function getStepDuration(step: StepLike): number | null {
  if (step.duration_min !== null && step.duration_min !== undefined) {
    return step.duration_min;
  }
  if (step.duration_seconds !== null && step.duration_seconds !== undefined) {
    return step.duration_seconds / 60;
  }
  return null;
}

export function groupWorkoutSteps(steps: WorkoutStep[] | StructuredWorkoutStep[]): GroupedStep[] {
  if (steps.length === 0) return [];

  const grouped: GroupedStep[] = [];
  let i = 0;

  while (i < steps.length) {
    const currentStep = steps[i] as StepLike;

    // FIRST: Check for consecutive identical steps (same name, intensity, distance per step)
    // This should take priority over repeating patterns to group blocks like "5x 1 mi" into "10 mi"
    let consecutiveCount = 1;
    const currentDistance = getStepDistance(currentStep);
    let totalDistance = currentDistance || 0;
    const stepBaseName = normalizeStepName(currentStep.name);
    const stepIntensity = currentStep.intensity || null;
    const stepDuration = getStepDuration(currentStep);
    const stepNotes = currentStep.notes || null;

    // Check if next steps are identical (same base name, intensity, duration, and same distance per step)
    while (i + consecutiveCount < steps.length) {
      const nextStep = steps[i + consecutiveCount] as StepLike;
      const nextBaseName = normalizeStepName(nextStep.name);
      const nextDistance = getStepDistance(nextStep);
      const nextDuration = getStepDuration(nextStep);
      
      // Group if:
      // 1. Same base name
      // 2. Same intensity (or both null)
      // 3. Same duration (or both null)
      // 4. Same distance per step (or both null) - this ensures we only group truly identical steps
      const sameName = nextBaseName === stepBaseName;
      const sameIntensity = (nextStep.intensity || null) === stepIntensity;
      const sameDuration = (stepDuration === null && nextDuration === null) || (stepDuration === nextDuration);
      const sameDistancePerStep = (currentDistance === null && nextDistance === null) || (currentDistance === nextDistance);
      
      if (sameName && sameIntensity && sameDuration && sameDistancePerStep) {
        if (nextDistance) {
          totalDistance += nextDistance;
        }
        consecutiveCount++;
      } else {
        break;
      }
    }

    // If we found consecutive identical steps, group them
    if (consecutiveCount > 1) {
      grouped.push({
        name: stepBaseName,
        count: consecutiveCount,
        totalDistanceKm: totalDistance > 0 ? totalDistance : null,
        durationMin: stepDuration,
        intensity: stepIntensity,
        notes: stepNotes,
        isRepeat: false,
      });
      i += consecutiveCount;
      continue;
    }

    // SECOND: Check for repeating 2-step pattern (e.g., Stride + Float)
    // Only check if we didn't find consecutive identical steps
    if (i < steps.length - 1) {
      const nextStep = steps[i + 1] as StepLike;
      const currentBaseName = normalizeStepName(currentStep.name);
      const nextBaseName = normalizeStepName(nextStep.name);
      
      // Check if this could be a repeating pattern
      let patternLength = 0;
      let repeatCount = 0;
      let isValidPattern = true;

      // Try to detect a repeating 2-step pattern
      while (i + patternLength + 1 < steps.length && isValidPattern) {
        const firstStep = steps[i + patternLength] as StepLike;
        const secondStep = steps[i + patternLength + 1] as StepLike;
        const firstBaseName = normalizeStepName(firstStep.name);
        const secondBaseName = normalizeStepName(secondStep.name);

        // Check if this matches our pattern
        if (firstBaseName === currentBaseName && secondBaseName === nextBaseName) {
          repeatCount++;
          patternLength += 2;
        } else {
          isValidPattern = false;
        }
      }

      // If we found a repeating pattern (at least 2 repetitions = 4 steps)
      if (repeatCount >= 2 && patternLength >= 4) {
        const firstStep = steps[i] as StepLike;
        const secondStep = steps[i + 1] as StepLike;
        
        // Get the base name without numbers for display
        const firstDisplayName = normalizeStepName(firstStep.name);
        const secondDisplayName = normalizeStepName(secondStep.name);
        
        grouped.push({
          name: `Repeat ${repeatCount} times:`,
          count: repeatCount,
          totalDistanceKm: null,
          durationMin: null,
          intensity: firstStep.intensity || null,
          notes: null,
          isRepeat: true,
          repeatSteps: [
            {
              name: firstDisplayName,
              durationMin: getStepDuration(firstStep),
              distanceKm: getStepDistance(firstStep),
              intensity: firstStep.intensity || null,
            },
            {
              name: secondDisplayName,
              durationMin: getStepDuration(secondStep),
              distanceKm: getStepDistance(secondStep),
              intensity: secondStep.intensity || null,
            },
          ],
        });
        i += patternLength;
        continue;
      }
    }

    // Single step (not grouped, not part of a pattern)
    grouped.push({
      name: currentStep.name,
      count: 1,
      totalDistanceKm: currentDistance,
      durationMin: stepDuration,
      intensity: stepIntensity,
      notes: stepNotes,
      isRepeat: false,
    });
    i++;
  }

  return grouped;
}

export function formatGroupedStepSummary(
  grouped: GroupedStep,
  convertDistance: (km: number) => { value: number; unit: string },
  formatDistance: (converted: { value: number; unit: string }) => string
): string {
  if (grouped.isRepeat && grouped.repeatSteps) {
    // Format: "Repeat N times: intensity Step1 details → Step2 details"
    const parts: string[] = [];
    
    if (grouped.intensity) {
      parts.push(grouped.intensity);
    }
    
    grouped.repeatSteps.forEach((step) => {
      const stepParts: string[] = [step.name];
      
      if (step.durationMin) {
        stepParts.push(`${step.durationMin} min`);
      }
      
      if (step.distanceKm) {
        const converted = convertDistance(step.distanceKm);
        stepParts.push(formatDistance(converted));
      }
      
      if (step.intensity) {
        stepParts.push(step.intensity);
      }
      
      parts.push(stepParts.join(' '));
    });
    
    return `Repeat ${grouped.count} times: ${parts.join(' → ')}`;
  }

  // Format single or grouped step
  const parts: string[] = [grouped.name];
  
  if (grouped.durationMin) {
    parts.push(`${grouped.durationMin} min`);
  }
  
  if (grouped.totalDistanceKm) {
    const converted = convertDistance(grouped.totalDistanceKm);
    parts.push(formatDistance(converted));
  }
  
  if (grouped.intensity) {
    parts.push(grouped.intensity);
  }
  
  return parts.join(' • ');
}
