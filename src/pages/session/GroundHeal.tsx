import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Pencil,
  Circle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StepProgress } from "@/components/session/StepProgress";
import { StepGuard } from "@/components/layout/StepGuard";
import {
  BoxBreathPacer,
  type BoxBreathPacerHandle,
  type PacerResult,
} from "@/components/session/BoxBreathPacer";
import { PressHold, type PressHoldResult } from "@/components/session/PressHold";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionStore } from "@/stores/sessionStore";
import { groundHealService } from "@/services/session/groundHealService";
import { GROUND_HEAL_THRESHOLDS } from "@/lib/config";
import { PACER } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useLeaveConfirmation } from "@/hooks/useLeaveConfirmation";

// ── Pass / fail evaluation ─────────────────────────────────────────
type StatusLevel = "good" | "marginal" | "fail";

const STATUS_COLORS: Record<StatusLevel, { dot: string; bg: string; text: string }> = {
  good: { dot: "text-success", bg: "bg-success/10", text: "text-success" },
  marginal: { dot: "text-amber-500", bg: "bg-amber-500/10", text: "text-amber-600" },
  fail: { dot: "text-destructive", bg: "bg-destructive/10", text: "text-destructive" },
};

function adherenceStatus(ratio: number): StatusLevel {
  if (ratio >= GROUND_HEAL_THRESHOLDS.ADHERENCE.GOOD) return "good";
  if (ratio >= GROUND_HEAL_THRESHOLDS.ADHERENCE.MARGINAL) return "marginal";
  return "fail";
}

function holdStatus(ms: number): StatusLevel {
  if (ms >= GROUND_HEAL_THRESHOLDS.HOLD_MS.GOOD) return "good";
  if (ms >= GROUND_HEAL_THRESHOLDS.HOLD_MS.MARGINAL) return "marginal";
  return "fail";
}

function releaseStatus(ms: number): StatusLevel {
  if (ms <= GROUND_HEAL_THRESHOLDS.RELEASE_MS.GOOD) return "good";
  if (ms <= GROUND_HEAL_THRESHOLDS.RELEASE_MS.MARGINAL) return "marginal";
  return "fail";
}

function improvementTip(label: string, status: StatusLevel, value: string): string | null {
  if (status === "good") return null;
  switch (label) {
    case "Adherence":
      return "Breathe along with the visual pacer to stay in sync.";
    case "Held":
      return "Hold the circle longer — aim for the full breath duration.";
    case "Release":
      return "Try to release more smoothly — a slower, controlled lift off the circle.";
    default:
      return null;
  }
}

// Compute the total pacer duration: cycles × 4 phases × PHASE_DURATION_MS
function computePacerDurationMs(cycles: number): number {
  return cycles * 4 * PACER.PHASE_DURATION_MS;
}

const PACER_CYCLES = 3;
const PACER_TOTAL_MS = computePacerDurationMs(PACER_CYCLES);

// ── Component ──────────────────────────────────────────────────────
const GroundHealInner = () => {
  const navigate = useNavigate();
  const { activeSessionId, advanceStep } = useSessionStore();

  const [pacer, setPacer] = useState<PacerResult | null>(null);
  const [press, setPress] = useState<PressHoldResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track whether the pacer has been started at least once (so the press can't
  // re-trigger it after completion)
  const [pacerStarted, setPacerStarted] = useState(false);

  // Ref to track pacer completion — avoids race conditions where the pacer
  // finishes between a React state update and the release callback
  const pacerCompletedRef = useRef(false);

  // Block navigation when results exist but haven't been saved yet
  const hasUnsavedResults = !!pacer && !!press && !saved && !saving;
  const { showConfirm, confirmLeave, cancelLeave } = useLeaveConfirmation(hasUnsavedResults);

  // Keys that force-remount the sub-components when incremented (edit / redo)
  const [pacerKey, setPacerKey] = useState(0);
  const [pressKey, setPressKey] = useState(0);

  // Ref to the pacer instance for external start/stop control
  const pacerRef = useRef<BoxBreathPacerHandle>(null);

  const pacerSectionRef = useRef<HTMLDivElement>(null);
  const pressSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useSessionStore.setState({ currentStep: "ground_heal" });
  }, []);

  const canSave = !!pacer && !!press;

  const handleSave = async () => {
    if (!activeSessionId || !pacer || !press) return;
    setSaveError(null);
    setSaving(true);
    try {
      await groundHealService.save(activeSessionId, {
        pacer_phase_timestamps: pacer.pacer_phase_timestamps,
        ground_adherence_ratio: pacer.ground_adherence_ratio,
        heal_press_start_ms: press.press_start_ms,
        heal_hold_duration_ms: press.hold_duration_ms,
        heal_release_velocity_ms: press.release_velocity_ms,
      });
      advanceStep("ground_heal");
      setSaved(true);
      navigate("/session/track");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while saving.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Synchronised interaction ──

  /** Called when the user presses down on the PressHold circle */
  const handlePressStart = useCallback(() => {
    // Start the pacer if it hasn't started yet and isn't already running/completed
    if (!pacerStarted && pacerRef.current) {
      pacerRef.current.start();
      setPacerStarted(true);
    }
  }, [pacerStarted]);

  /** Called when the user releases the PressHold circle.
   *  If the pacer already completed naturally, don't wipe the result.
   *  Uses a ref (not state) for the completion check to avoid races where
   *  the pacer finishes between a render and the release callback. */
  const handlePressEnd = useCallback(() => {
    const alreadyCompleted = pacerCompletedRef.current;
    if (pacerRef.current) {
      if (alreadyCompleted) {
        pacerRef.current.reset();
      } else {
        pacerRef.current.stop();
        pacerRef.current.reset();
      }
    }
    setPacerStarted(false);
    if (alreadyCompleted) {
      // Reset the completion flag so a new press can restart the pacer
      pacerCompletedRef.current = false;
    } else {
      setPacer(null);
    }
  }, []);

  /** Called when all 3 pacer cycles finish naturally */
  const handlePacerComplete = useCallback((result: PacerResult) => {
    pacerCompletedRef.current = true;
    setPacer(result);
  }, []);

  const editPacer = () => {
    setPacer(null);
    pacerCompletedRef.current = false;
    setPacerKey((k) => k + 1);
    setTimeout(() => pacerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const editPress = () => {
    setPress(null);
    setPressKey((k) => k + 1);
    setTimeout(() => pressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  /** Re-run both exercises from scratch — clears results and scrolls to top. */
  const rerunAll = () => {
    setPacer(null);
    setPress(null);
    setPacerStarted(false);
    pacerCompletedRef.current = false;
    setPacerKey((k) => k + 1);
    setPressKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell>
      <StepProgress />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Ground &amp; Heal</h2>
          <p className="text-sm text-muted-foreground">
            Slow the system with paced breath, then anchor with steady touch.
          </p>
        </header>

        {/* ── Section 1: Box-breath pacer ── */}
        <section ref={pacerSectionRef} className="space-y-3 scroll-mt-6">
          <SectionHeader
            index={1}
            title="Box-breath pacer"
            done={!!pacer}
            meta={
              pacer
                ? `Adherence ${Math.round(pacer.ground_adherence_ratio * 100)}%`
                : undefined
            }
          />
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <BoxBreathPacer
              key={pacerKey}
              ref={pacerRef}
              cycles={PACER_CYCLES}
              onComplete={handlePacerComplete}
            />
          </div>
        </section>

        {/* ── Section 2: Press & hold ── */}
        <section ref={pressSectionRef} className="space-y-3 scroll-mt-6">
          <SectionHeader
            index={2}
            title="Press & hold"
            done={!!press}
            meta={
              press ? `Held ${(press.hold_duration_ms / 1000).toFixed(1)}s` : undefined
            }
          />
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <PressHold
              key={pressKey}
              onComplete={setPress}
              targetDurationMs={PACER_TOTAL_MS}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
            />
          </div>
        </section>

        {/* ── Summary tiles with pass/fail (appears after both exercises complete) ── */}
        {pacer && press && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Review summary
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile
                label="Adherence"
                value={`${Math.round(pacer.ground_adherence_ratio * 100)}%`}
                status={adherenceStatus(pacer.ground_adherence_ratio)}
                improvementTip={improvementTip(
                  "Adherence",
                  adherenceStatus(pacer.ground_adherence_ratio),
                  `${Math.round(pacer.ground_adherence_ratio * 100)}%`
                )}
                labelRight="Edit"
                onLabelRightClick={editPacer}
              />
              <SummaryTile
                label="Held"
                value={`${(press.hold_duration_ms / 1000).toFixed(1)}s`}
                status={holdStatus(press.hold_duration_ms)}
                improvementTip={improvementTip(
                  "Held",
                  holdStatus(press.hold_duration_ms),
                  `${(press.hold_duration_ms / 1000).toFixed(1)}s`
                )}
                labelRight="Edit"
                onLabelRightClick={editPress}
              />
              <SummaryTile
                label="Release"
                value={`${press.release_velocity_ms}ms`}
                status={releaseStatus(press.release_velocity_ms)}
                improvementTip={improvementTip(
                  "Release",
                  releaseStatus(press.release_velocity_ms),
                  `${press.release_velocity_ms}ms`
                )}
                labelRight="Edit"
                onLabelRightClick={editPress}
              />
            </div>

            {/* Re-run all exercises */}
            <div className="flex justify-center pt-1">
              <Button variant="outline" size="sm" onClick={rerunAll}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Re-run results
              </Button>
            </div>
          </section>
        )}

        {/* ── Save button, inline error, and footnote ── */}
        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            size="lg"
            className={cn(
              "w-full h-12 transition-all",
              "bg-gradient-brand text-brand-foreground hover:opacity-95",
              saving && "pointer-events-none opacity-80"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save &amp; continue
              </>
            )}
          </Button>

          {/* ── Inline error banner with retry ── */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold text-destructive">
                        Failed to save
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {saveError}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSaveError(null)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Retry save
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[11px] text-muted-foreground text-center">
            All metrics stay on this device. No audio is recorded during this step.
          </p>
        </div>
      </motion.div>

      {/* ── Leave confirmation dialog ── */}
      <AlertDialog open={showConfirm} onOpenChange={(open) => !open && cancelLeave()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Discard results?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved Ground & Heal results. If you leave now they will
              be lost and you'll need to redo both exercises.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>Stay on page</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard & leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

// ── Summary tile ───────────────────────────────────────────────────
function SummaryTile({
  label,
  value,
  status,
  improvementTip: tip,
  labelRight,
  onLabelRightClick,
}: {
  label: string;
  value: string;
  status: StatusLevel;
  improvementTip: string | null;
  labelRight?: string;
  onLabelRightClick?: () => void;
}) {
  const colors = STATUS_COLORS[status];

  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm space-y-2 transition-colors",
        status === "good"
          ? "bg-card border-border/60"
          : colors.bg + " border-" + (status === "marginal" ? "amber-500/40" : "destructive/40")
      )}
    >
      {/* Header row: label + edit button */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {labelRight && onLabelRightClick && (
          <button
            type="button"
            onClick={onLabelRightClick}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand hover:text-brand/80 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            {labelRight}
          </button>
        )}
      </div>

      {/* Value + status dot */}
      <div className="flex items-center gap-2">
        <Circle className={cn("h-2.5 w-2.5 fill-current", colors.dot)} />
        <span className="text-xl font-bold tracking-tight">{value}</span>
      </div>

      {/* Improvement tip (only shown when not good) */}
      {tip && (
        <p className={cn("text-[10px] leading-relaxed", colors.text)}>
          {tip}
        </p>
      )}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────
function SectionHeader({
  index,
  title,
  done,
  meta,
}: {
  index: number;
  title: string;
  done?: boolean;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {index}. {title}
      </h3>
      {done && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium",
            "text-success"
          )}
        >
          <Check className="h-3 w-3" />
          {meta ?? "Done"}
        </span>
      )}
    </div>
  );
}

const GroundHealPage = () => (
  <StepGuard step="ground_heal">
    <GroundHealInner />
  </StepGuard>
);

export default GroundHealPage;
