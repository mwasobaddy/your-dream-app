import { useSessionStore, STEP_ORDER } from "@/stores/sessionStore";
import type { StepName } from "@/types/session";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<StepName, string> = {
  scan: "Scan",
  identify: "Identify",
  ground_heal: "Ground & Heal",
  track: "Track",
};

export function StepProgress() {
  const { currentStep, completedSteps } = useSessionStore();

  return (
    <ol className="flex items-center gap-2 mb-6" aria-label="Session progress">
      {STEP_ORDER.map((step, idx) => {
        const isDone = completedSteps.includes(step);
        const isActive = currentStep === step;
        return (
          <li key={step} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition-all flex-1 min-w-0",
                isActive && "bg-teal text-teal-foreground shadow-elegant",
                isDone && !isActive && "bg-success/10 text-success",
                !isActive && !isDone && "bg-muted text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  isActive && "bg-teal-foreground/20",
                  isDone && !isActive && "bg-success/20",
                  !isActive && !isDone && "bg-background/60"
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className="truncate">{STEP_LABELS[step]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
