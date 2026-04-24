import { create } from "zustand";
import type { StepName } from "@/types/session";

const STEP_ORDER: StepName[] = ["scan", "identify", "ground_heal", "track"];

export function nextStep(current: StepName): StepName | null {
  const idx = STEP_ORDER.indexOf(current);
  return idx >= 0 && idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

interface ActiveSessionState {
  activeSessionId: string | null;
  currentStep: StepName | null;
  completedSteps: StepName[];
  setActiveSession: (id: string) => void;
  advanceStep: (completed: StepName) => void;
  resetSession: () => void;
}

/**
 * Ephemeral state for the in-progress session only.
 * Completed sessions are written immediately to Dexie.
 * Never use this store as a cache for historical records.
 */
export const useSessionStore = create<ActiveSessionState>((set) => ({
  activeSessionId: null,
  currentStep: null,
  completedSteps: [],

  setActiveSession: (id) =>
    set({ activeSessionId: id, currentStep: "scan", completedSteps: [] }),

  advanceStep: (completed) =>
    set((state) => {
      const completedSteps = state.completedSteps.includes(completed)
        ? state.completedSteps
        : [...state.completedSteps, completed];
      return {
        completedSteps,
        currentStep: nextStep(completed),
      };
    }),

  resetSession: () =>
    set({ activeSessionId: null, currentStep: null, completedSteps: [] }),
}));

export { STEP_ORDER };
