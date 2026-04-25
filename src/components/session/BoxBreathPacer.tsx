import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PACER } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { PacerPhaseTimestamps } from "@/types/session";

type Phase = "inhale" | "hold1" | "exhale" | "hold2";

const PHASES: Phase[] = ["inhale", "hold1", "exhale", "hold2"];
const PHASE_LABEL: Record<Phase, string> = {
  inhale: "Inhale",
  hold1: "Hold",
  exhale: "Exhale",
  hold2: "Hold",
};

export interface PacerResult {
  pacer_phase_timestamps: PacerPhaseTimestamps;
  ground_adherence_ratio: number;
  cycles_completed: number;
  /** Total elapsed ms from start to finish */
  total_duration_ms: number;
}

export interface BoxBreathPacerHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

interface BoxBreathPacerProps {
  /** Number of full 4-phase cycles to perform. */
  cycles?: number;
  onComplete: (result: PacerResult) => void;
  onStart?: () => void;
  onStop?: () => void;
}

/**
 * Box-breath pacer: 4s inhale → 4s hold → 4s exhale → 4s hold.
 * Adherence is auto-reported at 100%.
 * Can be controlled externally via ref (start/stop/reset) so the parent
 * can tie it to the press-and-hold interaction.
 */
export const BoxBreathPacer = forwardRef<BoxBreathPacerHandle, BoxBreathPacerProps>(
  function BoxBreathPacer({ cycles = 3, onComplete, onStart, onStop }, ref) {
    const [running, setRunning] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [phaseIdx, setPhaseIdx] = useState(0); // 0..(cycles*4)
    const [, setPhaseStartedAt] = useState<number | null>(null);

    const startRef = useRef<number | null>(null);
    const firstCycleStampsRef = useRef<Partial<PacerPhaseTimestamps>>({});
    const intervalRef = useRef<number | null>(null);
    const finishedRef = useRef(false);

    const totalPhases = cycles * 4;
    const currentPhase = PHASES[phaseIdx % 4];

    const finish = useCallback(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRunning(false);
      setCompleted(true);

      const stamps = firstCycleStampsRef.current;
      const startedAt = startRef.current ?? performance.now();
      const totalDuration = stamps.cycle_end_ms ?? performance.now() - startedAt;

      const ideal = (i: number) => i * PACER.PHASE_DURATION_MS;
      const cycle: PacerPhaseTimestamps = {
        inhale_start_ms: stamps.inhale_start_ms ?? ideal(0),
        hold1_start_ms: stamps.hold1_start_ms ?? ideal(1),
        exhale_start_ms: stamps.exhale_start_ms ?? ideal(2),
        hold2_start_ms: stamps.hold2_start_ms ?? ideal(3),
        cycle_end_ms: stamps.cycle_end_ms ?? ideal(4),
      };

      onComplete({
        pacer_phase_timestamps: cycle,
        ground_adherence_ratio: 1,
        cycles_completed: cycles,
        total_duration_ms: Math.round(totalDuration),
      });
    }, [cycles, totalPhases, onComplete]);

    // Drive phase transitions while running.
    useEffect(() => {
      if (!running) return;
      intervalRef.current = window.setInterval(() => {
        setPhaseIdx((i) => {
          const next = i + 1;
          const now = performance.now();
          const startedAt = startRef.current ?? now;
          const rel = now - startedAt;
          if (next === 1) firstCycleStampsRef.current.hold1_start_ms = rel;
          if (next === 2) firstCycleStampsRef.current.exhale_start_ms = rel;
          if (next === 3) firstCycleStampsRef.current.hold2_start_ms = rel;
          if (next === 4) firstCycleStampsRef.current.cycle_end_ms = rel;
          setPhaseStartedAt(now);
          if (next >= totalPhases) {
            window.setTimeout(() => finish(), 50);
          }
          return next;
        });
      }, PACER.PHASE_DURATION_MS);

      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [running, totalPhases, finish]);

    const handleStart = useCallback(() => {
      if (running || completed) return;
      const now = performance.now();
      startRef.current = now;
      finishedRef.current = false;
      setPhaseStartedAt(now);
      firstCycleStampsRef.current = { inhale_start_ms: 0 };
      setPhaseIdx(0);
      setCompleted(false);
      setRunning(true);
      onStart?.();
    }, [running, completed, onStart]);

    const handleStop = useCallback(() => {
      if (!running || completed) return;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRunning(false);
      onStop?.();
    }, [running, completed, onStop]);

    const handleReset = useCallback(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      startRef.current = null;
      finishedRef.current = false;
      firstCycleStampsRef.current = {};
      setPhaseIdx(0);
      setRunning(false);
      setCompleted(false);
    }, []);

    // Expose imperative handle for parent control
    useImperativeHandle(ref, () => ({
      start: handleStart,
      stop: handleStop,
      reset: handleReset,
    }), [handleStart, handleStop, handleReset]);

    const scaleByPhase: Record<Phase, number> = {
      inhale: 1,
      hold1: 1,
      exhale: 0.55,
      hold2: 0.55,
    };
    const targetScale = scaleByPhase[currentPhase];
    const initialScale = currentPhase === "inhale" ? 0.55 : currentPhase === "exhale" ? 1 : targetScale;

    const cycleNum = Math.floor(phaseIdx / 4) + 1;
    const showCycle = running || completed;

    return (
      <div className="space-y-5">
        <div className="relative aspect-square w-full max-w-xs mx-auto grid place-items-center">
          {/* Outer guide square */}
          <div className="absolute inset-4 rounded-3xl border border-border/60" />

          {/* Animated breath square */}
          <motion.div
            aria-label="Breath pacer"
            className={cn(
              "relative aspect-square w-3/4 rounded-3xl",
              "bg-gradient-brand shadow-glow",
              "select-none",
              !running && !completed && "opacity-60"
            )}
            initial={{ scale: initialScale }}
            animate={{ scale: running ? targetScale : completed ? 0.55 : 0.7 }}
            transition={{
              duration: running ? PACER.PHASE_DURATION_MS / 1000 : 0.4,
              ease: "easeInOut",
            }}
          >
            <div className="absolute inset-0 grid place-items-center text-center px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentPhase}-${phaseIdx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-1"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-foreground/80">
                    {showCycle ? `Cycle ${Math.min(cycleNum, cycles)} / ${cycles}` : "Ready"}
                  </div>
                  <div className="text-2xl font-bold text-brand-foreground">
                    {completed ? "Done" : running ? PHASE_LABEL[currentPhase] : "Begin"}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {completed
            ? "All cycles complete. Press and hold the circle below during the breath."
            : running
              ? "4 seconds per phase · breathe along with the expanding square"
              : "Press and hold the circle below to start the breath pacer."}
        </p>

        {/* Reset button shown when completed */}
        {completed && (
          <div className="flex justify-center">
            <Button onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        )}
      </div>
    );
  }
);
