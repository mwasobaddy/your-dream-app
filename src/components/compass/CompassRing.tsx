import { cn } from "@/lib/utils";
import type { StepName } from "@/types/session";
import { STEP_ORDER } from "@/stores/sessionStore";

// ── Step visual config ────────────────────────────────────────────
const STEP_META: Record<
  StepName,
  { icon: string; label: string; desc: string; position: string }
> = {
  scan: {
    icon: "◉",
    label: "Scan",
    desc: "Notice what your body is holding. Take a moment to feel where tension lives.",
    position: "top",
  },
  identify: {
    icon: "◍",
    label: "Identify",
    desc: "Name the state. Use your voice to capture the baseline.",
    position: "right",
  },
  ground_heal: {
    icon: "◐",
    label: "Ground",
    desc: "Box breathing at 0.1Hz. Press and hold to release.",
    position: "bottom",
  },
  track: {
    icon: "◎",
    label: "Track",
    desc: "See the shift. Voice delta and somatic reflection.",
    position: "left",
  },
};

// ── Status types ──────────────────────────────────────────────────
type NodeStatus = "locked" | "unlocked" | "current" | "completed";

interface CompassRingProps {
  currentStep: StepName | null;
  completedSteps: StepName[];
  sessionActive: boolean;
  isComplete: boolean;
  onCenterClick: () => void;
  onStepClick: (step: StepName) => void;
}

// ── Helper: determine a step's status ─────────────────────────────
function stepStatus(
  step: StepName,
  currentStep: StepName | null,
  completedSteps: StepName[],
  sessionActive: boolean,
): NodeStatus {
  if (completedSteps.includes(step)) return "completed";
  if (currentStep === step) return "current";
  if (!sessionActive) return "locked";
  const idx = STEP_ORDER.indexOf(step);
  if (idx === 0) return "unlocked";
  const prev = STEP_ORDER[idx - 1];
  return completedSteps.includes(prev) ? "unlocked" : "locked";
}

// ── Progress arc calculation ──────────────────────────────────────
const ARC_CIRCUMFERENCE = 2 * Math.PI * 130; // r=130 in the SVG viewBox

function progressOffset(completedCount: number): number {
  const progress = (completedCount / STEP_ORDER.length) * ARC_CIRCUMFERENCE;
  return ARC_CIRCUMFERENCE - progress;
}

// ── Component ─────────────────────────────────────────────────────
export function CompassRing({
  currentStep,
  completedSteps,
  sessionActive,
  isComplete,
  onCenterClick,
  onStepClick,
}: CompassRingProps) {
  // Center label logic
  const centerLabel = isComplete
    ? "Done"
    : !sessionActive
      ? "Begin"
      : currentStep
        ? STEP_META[currentStep].label
        : "Begin";
  const centerSub = isComplete
    ? "View Summary"
    : !sessionActive
      ? "Session"
      : currentStep
        ? "In Progress"
        : "Session";

  const bottomHint = isComplete
    ? "All steps complete. Tap center to review."
    : !sessionActive
      ? "Tap center to begin your check-in"
      : currentStep
        ? `Complete ${STEP_META[currentStep].label} to continue`
        : "Tap center to begin your check-in";

  const handleStepClick = (step: StepName) => {
    const status = stepStatus(step, currentStep, completedSteps, sessionActive);
    if (status === "current") {
      onStepClick(step);
    } else if (status === "unlocked") {
      onStepClick(step);
    }
    // locked and completed nodes are not clickable for navigation
  };

  return (
    <div className="compass-container">
      {/* Brand */}
      <div className="compass-brand">
        <span className="compass-brand-name">SIGHT</span>
      </div>

      {/* Compass ring */}
      <div className="compass-ring">
        {/* Connector ring */}
        <div className="compass-connector-ring" />

        {/* Progress arc (SVG) */}
        <svg
          className="compass-progress-arc"
          viewBox="0 0 280 280"
          aria-hidden="true"
        >
          <circle
            cx="140"
            cy="140"
            r="130"
            fill="none"
            stroke="rgba(244,228,193,0.08)"
            strokeWidth="1"
          />
          <circle
            cx="140"
            cy="140"
            r="130"
            fill="none"
            stroke="rgba(244,228,193,0.3)"
            strokeWidth="2"
            strokeDasharray={ARC_CIRCUMFERENCE}
            strokeDashoffset={progressOffset(completedSteps.length)}
            strokeLinecap="round"
            transform="rotate(-90 140 140)"
            className="compass-arc-fill"
          />
        </svg>

        {/* Step nodes */}
        {STEP_ORDER.map((step) => {
          const meta = STEP_META[step];
          const status = stepStatus(step, currentStep, completedSteps, sessionActive);
          return (
            <button
              key={step}
              onClick={() => handleStepClick(step)}
              disabled={status === "locked" || status === "completed"}
              className={cn(
                "compass-step-node",
                `compass-step-${meta.position}`,
                `compass-step-${status}`,
              )}
              aria-label={`${meta.label} step — ${status}`}
            >
              <span className="compass-step-icon">{meta.icon}</span>
              <span className="compass-step-label">{meta.label}</span>
            </button>
          );
        })}

        {/* Center node */}
        <button
          onClick={onCenterClick}
          className={cn(
            "compass-center-node",
            (!sessionActive || isComplete) && "compass-center-active",
          )}
          aria-label={centerLabel}
        >
          <span className="compass-center-label">{centerLabel}</span>
          <span className="compass-center-sub">{centerSub}</span>
        </button>
      </div>

      {/* Trust pill */}
      <div className="compass-trust-pill">
        <span className="compass-trust-dot" />
        <span>Local-only</span>
      </div>

      {/* Bottom hint */}
      <p className="compass-bottom-hint">{bottomHint}</p>
    </div>
  );
}
