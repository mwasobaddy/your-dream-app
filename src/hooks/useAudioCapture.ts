import { useCallback, useRef, useState } from "react";
import { audioService } from "@/services/audio/audioService";
import type { VoiceProsodyFeatures } from "@/types/session";
import { CAPTURE } from "@/lib/config";

type CaptureState = "idle" | "recording" | "processing" | "done" | "error";

export function useAudioCapture() {
  const [state, setState] = useState<CaptureState>("idle");
  const [result, setResult] = useState<VoiceProsodyFeatures | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<ReturnType<typeof audioService.startCapture> | null>(null);

  const start = useCallback(
    (durationMs: number = CAPTURE.DURATION_MS) => {
      if (state === "recording") return;
      setState("recording");
      setError(null);
      setResult(null);

      const ctrl = audioService.startCapture(durationMs);
      controllerRef.current = ctrl;

      ctrl.result
        .then((raw) => {
          setState("processing");
          const prosody = audioService.extractProsody(raw);
          setResult(prosody);
          setState("done");
          return prosody;
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Capture failed";
          setError(message);
          setState("error");
        });
    },
    [state]
  );

  const stop = useCallback(() => {
    controllerRef.current?.stop();
    controllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.stop();
    controllerRef.current = null;
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, start, stop, reset };
}
