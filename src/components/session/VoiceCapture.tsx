import { motion } from "framer-motion";
import { Mic, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { CAPTURE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import type { VoiceProsodyFeatures } from "@/types/session";

interface VoiceCaptureProps {
  /** Called once with the final prosody result. */
  onCaptured: (prosody: VoiceProsodyFeatures) => void;
  /** Optional override for capture duration in ms. */
  durationMs?: number;
  /** Allow the user to skip if mic is unavailable / they prefer not to. */
  onSkip?: () => void;
  promptText?: string;
}

export function VoiceCapture({
  onCaptured,
  durationMs = CAPTURE.DURATION_MS,
  onSkip,
  promptText = "Press and hold the button while you speak. Release when you're done.",
}: VoiceCaptureProps) {
  const { state, result, error, start, stop } = useAudioCapture();
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Forward result to parent
  useEffect(() => {
    if (result) onCaptured(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Progress bar while recording
  useEffect(() => {
    if (state !== "recording") {
      setProgress(0);
      return;
    }
    const startTime = performance.now();
    const tick = () => {
      const pct = Math.min(1, (performance.now() - startTime) / durationMs);
      setProgress(pct);
    };
    holdTimerRef.current = setInterval(tick, 50);
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [state, durationMs]);

  const handlePointerDown = () => {
    if (state !== "idle" && state !== "done" && state !== "error") return;
    start(durationMs);
  };

  const handlePointerUp = () => {
    if (state === "recording") stop();
  };

  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const hasResult = state === "done" && result;

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        {promptText}
      </p>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative">
          {/* Pulse rings while recording */}
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-teal/30"
                animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-teal/20"
                animate={{ scale: [1, 1.9], opacity: [0.4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}

          <button
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            disabled={isProcessing}
            className={cn(
              "relative grid h-28 w-28 place-items-center rounded-full text-teal-foreground transition-all shadow-elevated select-none",
              isRecording ? "bg-destructive scale-105" : "bg-gradient-teal hover:scale-105",
              isProcessing && "opacity-70",
              !isRecording && !isProcessing && "active:scale-95"
            )}
            aria-label={isRecording ? "Recording — release to stop" : "Hold to record"}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </button>
        </div>

        <div className="text-center min-h-[3rem]">
          {state === "idle" && (
            <p className="text-xs text-muted-foreground">
              Hold to record · up to {Math.round(durationMs / 1000)}s
            </p>
          )}
          {isRecording && (
            <>
              <p className="text-sm font-medium text-foreground">Recording — keep speaking…</p>
              <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-teal transition-[width] duration-100"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </>
          )}
          {isProcessing && (
            <p className="text-sm text-muted-foreground">Analysing voice…</p>
          )}
          {hasResult && (
            <ProsodyResultCard prosody={result!} />
          )}
          {state === "error" && (
            <p className="text-xs text-destructive flex items-center gap-1.5 justify-center">
              <AlertTriangle className="h-3.5 w-3.5" /> {error ?? "Capture failed"}
            </p>
          )}
        </div>

        {onSkip && state !== "recording" && state !== "processing" && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs">
            Skip voice capture
          </Button>
        )}
      </div>
    </div>
  );
}

function ProsodyResultCard({ prosody }: { prosody: VoiceProsodyFeatures }) {
  const valid = prosody.validity === "valid";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
        valid ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      )}
    >
      {valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {valid ? (
        <span>
          Captured · {prosody.pitch_mean_hz?.toFixed(0)} Hz ·{" "}
          {prosody.energy_rms_db?.toFixed(1)} dB
        </span>
      ) : (
        <span>Quality: {prosody.validity.replace("_", " ")}</span>
      )}
    </div>
  );
}
