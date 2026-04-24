import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw } from "lucide-react";
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

// Window (ms) around each phase boundary in which a tap counts as "on-beat".
const ADHERENCE_WINDOW_MS = 800;

export interface PacerResult {
  pacer_phase_timestamps: PacerPhaseTimestamps;
  ground_adherence_ratio: number;
  cycles_completed: number;
}

interface BoxBreathPacerProps {
  /** Number of full 4-phase cycles to perform. */
  cycles?: number;
  onComplete: (result: PacerResult) => void;
}

/**
 * Box-breath pacer: 4s inhale → 4s hold → 4s exhale → 4s hold.
 * Adherence is computed from how close the user's taps land to phase boundaries.
 */
export function BoxBreathPacer({ cycles = 3, onComplete }: BoxBreathPacerProps) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0); // 0..(cycles*4)

  // Refs collect data across the run without re-renders.
  const startRef = useRef<number | null>(null);
  const tapsRef = useRef<number[]>([]);
  const firstCycleStampsRef = useRef<Partial<PacerPhaseTimestamps>>({});
  const intervalRef = useRef<number | null>(null);

  const totalPhases = cycles * 4;
  const currentPhase = PHASES[phaseIdx % 4];

  const finish = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setCompleted(true);

    const start = startRef.current ?? 0;
    const stamps = firstCycleStampsRef.current;

    // Build a complete cycle stamp set (relative ms from session start).
    // If anything is missing (shouldn't happen), fall back to ideal timings.
    const ideal = (i: number) => i * PACER.PHASE_DURATION_MS;
    const cycle: PacerPhaseTimestamps = {
      inhale_start_ms: stamps.inhale_start_ms ?? ideal(0),
      hold1_start_ms: stamps.hold1_start_ms ?? ideal(1),
      exhale_start_ms: stamps.exhale_start_ms ?? ideal(2),
      hold2_start_ms: stamps.hold2_start_ms ?? ideal(3),
      cycle_end_ms: stamps.cycle_end_ms ?? ideal(4),
    };

    // Adherence: count taps that fall within ADHERENCE_WINDOW_MS of a boundary.
    const boundaries: number[] = [];
    for (let i = 0; i <= totalPhases; i++) {
      boundaries.push(start + i * PACER.PHASE_DURATION_MS);
    }
    let onBeat = 0;
    for (const t of tapsRef.current) {
      const closest = boundaries.reduce((best, b) =>
        Math.abs(b - t) < Math.abs(best - t) ? b : best
      );
      if (Math.abs(closest - t) <= ADHERENCE_WINDOW_MS) onBeat++;
    }
    // Expect ~1 tap per phase boundary the user experienced.
    const expected = Math.max(1, totalPhases);
    const adherence = Math.min(1, tapsRef.current.length === 0 ? 0 : onBeat / expected);

    onComplete({
      pacer_phase_timestamps: cycle,
      ground_adherence_ratio: Number(adherence.toFixed(3)),
      cycles_completed: cycles,
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
        // Capture first-cycle stamps for the schema.
        if (next === 1) firstCycleStampsRef.current.hold1_start_ms = rel;
        if (next === 2) firstCycleStampsRef.current.exhale_start_ms = rel;
        if (next === 3) firstCycleStampsRef.current.hold2_start_ms = rel;
        if (next === 4) firstCycleStampsRef.current.cycle_end_ms = rel;
        setPhaseStartedAt(now);
        if (next >= totalPhases) {
          // Finish on the next tick so UI shows the final state briefly.
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

  const handleStart = () => {
    const now = performance.now();
    startRef.current = now;
    setPhaseStartedAt(now);
    firstCycleStampsRef.current = { inhale_start_ms: 0 };
    tapsRef.current = [];
    setPhaseIdx(0);
    setCompleted(false);
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleReset = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    startRef.current = null;
    tapsRef.current = [];
    firstCycleStampsRef.current = {};
    setPhaseIdx(0);
    setRunning(false);
    setCompleted(false);
  };

  const handleTap = () => {
    if (!running || startRef.current == null) return;
    tapsRef.current.push(performance.now());
  };

  // Square scales: inhale grows, hold1 holds large, exhale shrinks, hold2 holds small.
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

        {/* Animated breath square — tap target */}
        <motion.button
          type="button"
          onClick={handleTap}
          aria-label="Tap on the beat"
          className={cn(
            "relative aspect-square w-3/4 rounded-3xl",
            "bg-gradient-teal shadow-glow",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-foreground/80">
                  {showCycle ? `Cycle ${Math.min(cycleNum, cycles)} / ${cycles}` : "Ready"}
                </div>
                <div className="text-2xl font-bold text-teal-foreground">
                  {completed ? "Done" : running ? PHASE_LABEL[currentPhase] : "Begin"}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        4 seconds per phase · tap the square on each transition to track adherence
      </p>

      <div className="flex justify-center gap-2">
        {!running && !completed && (
          <Button onClick={handleStart} size="lg" className="bg-gradient-teal text-teal-foreground hover:opacity-95">
            <Play className="h-4 w-4 mr-1" />
            Start pacer
          </Button>
        )}
        {running && (
          <Button onClick={handlePause} size="lg" variant="secondary">
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
        )}
        {(completed || (!running && phaseIdx > 0)) && (
          <Button onClick={handleReset} size="lg" variant="outline">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
