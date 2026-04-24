import type { CaptureValidity } from "@/types/session";
import { QUALITY_GATE } from "@/lib/config";

export interface QualityGateInput {
  snrDb: number;
  voicedFramesRatio: number;
}

export function evaluateQuality({
  snrDb,
  voicedFramesRatio,
}: QualityGateInput): CaptureValidity {
  if (snrDb < QUALITY_GATE.MIN_SNR_DB) return "invalid_snr";
  if (voicedFramesRatio < QUALITY_GATE.MIN_VOICED_FRAMES_RATIO)
    return "invalid_frames";
  return "valid";
}
