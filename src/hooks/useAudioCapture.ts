import { useCallback, useState } from "react";
import { audioService } from "@/services/audio/audioService";
import type { VoiceProsodyFeatures } from "@/types/session";
import { CAPTURE } from "@/lib/config";

type CaptureState = "idle" | "recording" | "processing" | "done" | "error";

export function useAudioCapture() {
  const [state, setState] = useState<CaptureState>("idle");
  const [result, setResult] = useState<VoiceProsodyFeatures | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(
    async (durationMs: number = CAPTURE.DURATION_MS): Promise<VoiceProsodyFeatures> => {
      setState("recording");
      setError(null);
      setResult(null);
      try {
        const raw = await audioService.startCapture(durationMs);
        setState("processing");
        const prosody = audioService.extractProsody(raw);
        setResult(prosody);
        setState("done");
        return prosody;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Capture failed";
        setError(message);
        setState("error");
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, capture, reset };
}
