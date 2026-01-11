/**
 * Phase 6B: Planning Execution API
 * 
 * Frontend never mutates plans - backend is the single source of truth.
 * These functions only call backend endpoints for preview and execution.
 */

import { api } from '../api';
import type { WeekPlan, ExecutionPreviewResponse, ExecutionResponse } from '@/types/execution';

/**
 * Preview execution and check for conflicts
 * 
 * @param weekPlans - Array of week plans to preview
 * @param startDate - Start date for the plan (YYYY-MM-DD)
 * @param timezone - User's timezone
 * @returns Preview response with conflicts
 */
export const previewExecution = async (
  weekPlans: WeekPlan[],
  startDate: string,
  timezone: string
): Promise<ExecutionPreviewResponse> => {
  console.log('[API] Previewing execution:', { weekPlansCount: weekPlans.length, startDate, timezone });
  try {
    const response = await api.post('/planning/execute/preview', {
      week_plans: weekPlans,
      start_date: startDate,
      timezone,
    });
    return response as unknown as ExecutionPreviewResponse;
  } catch (error) {
    console.error('[API] Failed to preview execution:', error);
    throw error;
  }
};

/**
 * Execute the plan (atomic operation on backend)
 * 
 * @param weekPlans - Array of week plans to execute
 * @param startDate - Start date for the plan (YYYY-MM-DD)
 * @param timezone - User's timezone
 * @returns Execution response
 */
export const executePlan = async (
  weekPlans: WeekPlan[],
  startDate: string,
  timezone: string
): Promise<ExecutionResponse> => {
  console.log('[API] Executing plan:', { weekPlansCount: weekPlans.length, startDate, timezone });
  try {
    const response = await api.post('/planning/execute', {
      week_plans: weekPlans,
      start_date: startDate,
      timezone,
    });
    return response as unknown as ExecutionResponse;
  } catch (error) {
    console.error('[API] Failed to execute plan:', error);
    throw error;
  }
};
