import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useSessionStore, STEP_ORDER } from "@/stores/sessionStore";
import type { StepName } from "@/types/session";

interface StepGuardProps {
  step: StepName;
  children: React.ReactNode;
}

/**
 * Prevents direct URL access to a step the user has not yet earned.
 * If the route step is ahead of the user's progress, redirect to the current step.
 * If there is no active session, redirect to the landing page.
 */
export function StepGuard({ step, children }: StepGuardProps) {
  const { activeSessionId, currentStep, completedSteps } = useSessionStore();

  if (!activeSessionId) {
    return <Navigate to="/" replace />;
  }

  const stepIdx = STEP_ORDER.indexOf(step);
  const allowedIdx = Math.max(
    completedSteps.length,
    currentStep ? STEP_ORDER.indexOf(currentStep) : 0
  );

  if (stepIdx > allowedIdx) {
    const target = STEP_ORDER[allowedIdx] ?? "scan";
    return <Navigate to={`/session/${target.replace("_", "-")}`} replace />;
  }

  return <>{children}</>;
}

/** Convert URL-friendly slug to step name. */
export function useStepFromParams(): StepName | null {
  const { step } = useParams<{ step: string }>();
  if (!step) return null;
  const normalised = step.replace("-", "_") as StepName;
  return STEP_ORDER.includes(normalised) ? normalised : null;
}

/** Sync the URL step with the Zustand currentStep so back-button works. */
export function useSyncCurrentStep(step: StepName) {
  const setCurrent = useSessionStore((s) => s.currentStep);
  useEffect(() => {
    if (setCurrent !== step) {
      useSessionStore.setState({ currentStep: step });
    }
  }, [step, setCurrent]);
}
