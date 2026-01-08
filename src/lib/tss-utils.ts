import type { CompletedActivity } from '@/types';
import { fetchTrainingLoad } from './api';

/**
 * Training load data from the API
 */
export interface TrainingLoadData {
  dates: string[];
  daily_load: number[];
  daily_tss: number[];
  ctl: number[];
  atl: number[];
  tsb: number[];
  weekly_dates?: string[];
  weekly_volume?: number[];
  weekly_rolling_avg?: number[];
  last_updated?: string;
}

/**
 * Creates a map of date -> TSS from training load data
 */
export function createTssMap(trainingLoadData: TrainingLoadData | null | undefined): Map<string, number> {
  const tssMap = new Map<string, number>();
  
  // Ensure trainingLoadData exists and has the required array properties
  if (!trainingLoadData || 
      !Array.isArray(trainingLoadData.dates) || 
      !Array.isArray(trainingLoadData.daily_tss)) {
    return tssMap;
  }
  
  trainingLoadData.dates.forEach((date, index) => {
    const tss = trainingLoadData.daily_tss[index];
    if (tss !== undefined && tss !== null && !isNaN(tss)) {
      // TSS is normalized to -100 to 100, convert to absolute value for display
      // Negative values typically indicate recovery/rest days
      const absoluteTss = Math.abs(tss);
      tssMap.set(date, absoluteTss);
    }
  });
  
  return tssMap;
}

/**
 * Enriches activities with TSS data from training load endpoint
 */
export function enrichActivitiesWithTss(
  activities: CompletedActivity[] | null | undefined,
  trainingLoadData: TrainingLoadData | null | undefined
): CompletedActivity[] {
  // Ensure activities is an array
  if (!activities || !Array.isArray(activities)) {
    return [];
  }
  
  const tssMap = createTssMap(trainingLoadData);
  
  return activities.map(activity => {
    const activityDate = activity.date?.split('T')[0] || activity.date;
    const tss = tssMap.get(activityDate);
    
    // Only override if we have TSS from training load and activity doesn't already have it
    if (tss !== undefined && (!activity.trainingLoad || activity.trainingLoad === 0)) {
      return {
        ...activity,
        trainingLoad: Math.round(tss),
      };
    }
    
    return activity;
  });
}

/**
 * Gets TSS for a specific date
 */
export function getTssForDate(
  date: string,
  trainingLoadData: TrainingLoadData | null | undefined
): number | null {
  // Ensure trainingLoadData exists and has the required array properties
  if (!trainingLoadData || 
      !Array.isArray(trainingLoadData.dates) || 
      !Array.isArray(trainingLoadData.daily_tss)) {
    return null;
  }
  
  const dateStr = date.split('T')[0];
  const index = trainingLoadData.dates.indexOf(dateStr);
  
  if (index === -1) {
    return null;
  }
  
  const tss = trainingLoadData.daily_tss[index];
  if (tss === undefined || tss === null || isNaN(tss)) {
    return null;
  }
  
  // Return absolute value for display
  return Math.abs(tss);
}

