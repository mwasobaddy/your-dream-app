import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CamoBackground } from "@/components/layout/CamoBackground";
import { ShellNavigation } from "@/components/layout/ShellNavigation";
import { CompassRing } from "@/components/compass/CompassRing";
import { SessionOverlay } from "@/components/compass/SessionOverlay";
import { useSessionStore, STEP_ORDER } from "@/stores/sessionStore";
import { startNewSession } from "@/services/session/sessionOrchestrator";
import type { StepName } from "@/types/session";

/**
 * Route map from StepName to the actual session page path.
 */
const STEP_ROUTE: Record<StepName, string> = {
  scan: "/session/scan",
  identify: "/session/identify",
  ground_heal: "/session/ground-heal",
  track: "/session/track",
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    activeSessionId,
    currentStep,
    completedSteps,
    setActiveSession,
    resetSession,
  } = useSessionStore();

  const [overlayStep, setOverlayStep] = useState<StepName | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const autoOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionActive = !!activeSessionId;
  const isComplete =
    sessionActive && completedSteps.length === STEP_ORDER.length;

  // ── Auto-open overlay when returning from a completed step ────
  // The session pages navigate to "/?next=<step>" after completing.
  // We show the compass briefly, then auto-open the overlay for the next step.
  useEffect(() => {
    const nextStep = searchParams.get("next") as StepName | null;
    if (nextStep && STEP_ORDER.includes(nextStep) && sessionActive) {
      // Ensure store is in sync
      useSessionStore.setState({ currentStep: nextStep });

      // Brief delay so the user sees progress on the compass ring
      autoOpenTimer.current = setTimeout(() => {
        setOverlayStep(nextStep);
        setOverlayOpen(true);
      }, 600);

      return () => {
        if (autoOpenTimer.current) clearTimeout(autoOpenTimer.current);
      };
    }
  }, [searchParams, sessionActive]);

  // ── Center click ──────────────────────────────────────────────
  const handleCenterClick = useCallback(async () => {
    if (isComplete) {
      if (activeSessionId) {
        navigate(`/session/summary/${activeSessionId}`);
      }
      resetSession();
      return;
    }

    if (!sessionActive) {
      setStarting(true);
      try {
        const id = await startNewSession();
        setActiveSession(id);
        setOverlayStep("scan");
        setOverlayOpen(true);
      } catch (err) {
        console.error("Could not start session", err);
      } finally {
        setStarting(false);
      }
      return;
    }

    // Session in progress — open overlay for current step
    if (currentStep) {
      setOverlayStep(currentStep);
      setOverlayOpen(true);
    }
  }, [sessionActive, isComplete, activeSessionId, currentStep, navigate, setActiveSession, resetSession]);

  // ── Step node click ───────────────────────────────────────────
  const handleStepClick = useCallback(
    (step: StepName) => {
      if (step === currentStep) {
        setOverlayStep(step);
        setOverlayOpen(true);
      } else if (
        !completedSteps.includes(step) &&
        completedSteps.includes(STEP_ORDER[STEP_ORDER.indexOf(step) - 1])
      ) {
        // Unlocked step — set as current and open overlay
        useSessionStore.setState({ currentStep: step });
        setOverlayStep(step);
        setOverlayOpen(true);
      }
    },
    [currentStep, completedSteps],
  );

  // ── Overlay "Begin" — navigate to the step's full page ────────
  const handleOverlayBegin = useCallback(() => {
    setOverlayOpen(false);
    if (overlayStep) {
      useSessionStore.setState({ currentStep: overlayStep });
      navigate(STEP_ROUTE[overlayStep]);
    }
  }, [overlayStep, navigate]);

  const handleOverlayClose = useCallback(() => {
    setOverlayOpen(false);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <CamoBackground />

      <div className="absolute inset-x-0 top-0 z-20 px-4 pt-3">
        <div className="mx-auto flex max-w-2xl justify-end">
          <ShellNavigation />
        </div>
      </div>

      <CompassRing
        currentStep={currentStep}
        completedSteps={completedSteps}
        sessionActive={sessionActive}
        isComplete={isComplete}
        onCenterClick={handleCenterClick}
        onStepClick={handleStepClick}
      />

      <SessionOverlay
        step={overlayStep}
        open={overlayOpen}
        onBegin={handleOverlayBegin}
        onClose={handleOverlayClose}
      />
    </div>
  );
};

export default Index;
