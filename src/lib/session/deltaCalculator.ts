import type { VoiceDelta, VoiceProsodyFeatures } from "@/types/session";

/**
 * Computes the delta between baseline and post-intervention voice prosody.
 * Pure function — no side effects, fully unit-testable.
 *
 * If either capture was invalid (not "valid"), the delta is not computable
 * and both numeric values are null.
 */
export function computeVoiceDelta(
  baseline: VoiceProsodyFeatures,
  post: VoiceProsodyFeatures
): VoiceDelta {
  const computable =
    baseline.validity === "valid" && post.validity === "valid";

  return {
    pitch_delta_hz: computable
      ? (post.pitch_mean_hz ?? null) !== null &&
        (baseline.pitch_mean_hz ?? null) !== null
        ? (post.pitch_mean_hz as number) - (baseline.pitch_mean_hz as number)
        : null
      : null,
    energy_delta_db: computable
      ? (post.energy_rms_db ?? null) !== null &&
        (baseline.energy_rms_db ?? null) !== null
        ? (post.energy_rms_db as number) - (baseline.energy_rms_db as number)
        : null
      : null,
    computable,
  };
}
