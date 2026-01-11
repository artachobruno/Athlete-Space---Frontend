import { create } from "zustand";
import { PlanningProgressEvent } from "@/types/planningProgress";

interface PlanningProgressState {
  events: PlanningProgressEvent[];
  percent: number;
  activePhase?: string;
  lastEventTimestamp?: number;

  reset: () => void;
  addEvent: (event: PlanningProgressEvent) => void;
}

export const usePlanningProgressStore = create<PlanningProgressState>((set) => ({
  events: [],
  percent: 0,
  activePhase: undefined,
  lastEventTimestamp: undefined,

  reset: () => set({ events: [], percent: 0, activePhase: undefined, lastEventTimestamp: undefined }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
      percent: Math.max(state.percent, event.percent_complete),
      activePhase: event.phase,
      lastEventTimestamp: Date.now(),
    })),
}));
