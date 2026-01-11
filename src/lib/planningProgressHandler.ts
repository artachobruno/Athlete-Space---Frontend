import { usePlanningProgressStore } from "@/store/planningProgressStore";
import type { PlanningProgressEvent } from "@/types/planningProgress";

/**
 * Handles planning progress events from the backend.
 * This function should be called whenever a planning_progress event is received
 * (via SSE, polling, WebSocket, or other event mechanisms).
 */
export function handlePlanningProgressEvent(event: PlanningProgressEvent): void {
  usePlanningProgressStore.getState().addEvent(event);
}

/**
 * Generic server event handler that dispatches planning progress events.
 * This can be integrated with existing event handling systems.
 */
export function handleServerEvent(event: { type: string; payload?: unknown }): void {
  if (event.type === "planning_progress") {
    const payload = event.payload as PlanningProgressEvent;
    if (payload && payload.phase && payload.status && typeof payload.percent_complete === "number") {
      handlePlanningProgressEvent(payload);
    }
  }
}
