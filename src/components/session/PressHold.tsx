import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PressHoldResult {
  /** ms relative to component mount when press started */
  press_start_ms: number;
  /** total ms held down */
  hold_duration_ms: number;
  /** ms it took for release after the user began letting go */
  release_velocity_ms: number;
}

const MIN_VALID_HOLD_MS = 2000;

interface PressHoldProps {
  onComplete: (result: PressHoldResult) => void;
  /** Duration the user should hold to fill the ring (ms). Default 6000. */
  targetDurationMs?: number;
  /** Called when the user presses down */
  onPressStart?: () => void;
  /** Called when the user releases (regardless of validity) */
  onPressEnd?: () => void;
}

/**
 * Press-and-hold target. The user places a hand/finger on a calm body region
 * (heart, belly) and holds. The ring fills over `targetDurationMs` which
 * should match the total breath pacer time for synchronisation.
 */
export function PressHold({
  onComplete,
  targetDurationMs = 6000,
  onPressStart,
  onPressEnd,
}: PressHoldProps) {
  const mountRef = useRef<number>(performance.now());
  const pressStartRef = useRef<number | null>(null);
  const releaseInitRef = useRef<number | null>(null);

  const [pressed, setPressed] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [result, setResult] = useState<PressHoldResult | null>(null);

  // Smooth animated progress while pressed.
  useEffect(() => {
    if (!pressed) return;
    let raf: number;
    const tick = () => {
      const start = pressStartRef.current ?? performance.now();
      const elapsed = performance.now() - start;
      setProgress(Math.min(1, elapsed / targetDurationMs));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pressed, targetDurationMs]);

  const handlePressStart = () => {
    if (result) return;
    const now = performance.now();
    pressStartRef.current = now;
    releaseInitRef.current = null;
    setPressed(true);
    setProgress(0);
    onPressStart?.();
  };

  const handlePressEnd = () => {
    if (!pressed || pressStartRef.current == null) return;
    const now = performance.now();
    if (releaseInitRef.current == null) {
      releaseInitRef.current = now;
    }
    const start = pressStartRef.current;
    const hold = now - start;
    setPressed(false);
    onPressEnd?.();

    requestAnimationFrame(() => {
      const releaseEnd = performance.now();
      const release = Math.max(0, releaseEnd - (releaseInitRef.current ?? releaseEnd));
      const r: PressHoldResult = {
        press_start_ms: Math.round(start - mountRef.current),
        hold_duration_ms: Math.round(hold),
        release_velocity_ms: Math.round(release),
      };

      if (hold < MIN_VALID_HOLD_MS) {
        pressStartRef.current = null;
        setProgress(0);
        return;
      }
      setResult(r);
      onComplete(r);
    });
  };

  const handleReset = () => {
    pressStartRef.current = null;
    releaseInitRef.current = null;
    setPressed(false);
    setProgress(0);
    setResult(null);
  };

  const totalSeconds = Math.round(targetDurationMs / 1000);

  return (
    <div className="space-y-4">
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Press and hold"
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={() => pressed && handlePressEnd()}
        onPointerCancel={() => pressed && handlePressEnd()}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !pressed && !result) {
            e.preventDefault();
            handlePressStart();
          }
        }}
        onKeyUp={(e) => {
          if ((e.key === " " || e.key === "Enter") && pressed) {
            e.preventDefault();
            handlePressEnd();
          }
        }}
        className={cn(
          "relative mx-auto grid place-items-center select-none touch-none cursor-pointer",
          "h-44 w-44 rounded-full",
          "bg-accent border border-border/60",
          "transition-shadow",
          pressed && "shadow-glow",
          result && "opacity-90"
        )}
        animate={{ scale: pressed ? 0.96 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="hsl(var(--teal))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            style={{ transition: pressed ? "none" : "stroke-dashoffset 0.4s ease-out" }}
          />
        </svg>

        <div className="relative text-center px-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-1"
              >
                <Check className="h-8 w-8 mx-auto text-success" />
                <div className="text-xs text-muted-foreground">
                  Held {(result.hold_duration_ms / 1000).toFixed(1)}s
                </div>
              </motion.div>
            ) : pressed ? (
              <motion.div key="hold" className="space-y-1">
                <div className="text-2xl font-bold text-teal">
                  {Math.ceil((1 - progress) * totalSeconds)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Keep holding
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" className="space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  Press &amp; hold
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  ~{totalSeconds} seconds
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="text-xs text-center text-muted-foreground">
        Place a hand on your chest or belly. Press and hold the circle for the
        duration of the breath.
      </p>

      {result && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
