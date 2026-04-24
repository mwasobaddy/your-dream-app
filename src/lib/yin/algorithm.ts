/**
 * YIN pitch detection algorithm — pure function, no browser APIs.
 * Reference: de Cheveigné & Kawahara (2002), "YIN, a fundamental frequency
 * estimator for speech and music."
 *
 * Returns null when no reliable pitch is detected above the threshold.
 */

export interface YINResult {
  pitch_hz: number | null;
  pitch_confidence: number; // 0..1, derived from 1 - cmnd[tau]
}

export function computePitch(
  audioBuffer: Float32Array,
  sampleRate: number,
  pitchFloorHz: number,
  pitchCeilingHz: number,
  threshold: number
): YINResult {
  const bufferSize = audioBuffer.length;
  const halfBuffer = Math.floor(bufferSize / 2);

  const tauMin = Math.max(2, Math.floor(sampleRate / pitchCeilingHz));
  const tauMax = Math.min(halfBuffer - 1, Math.floor(sampleRate / pitchFloorHz));
  if (tauMax <= tauMin) return { pitch_hz: null, pitch_confidence: 0 };

  // Step 1 & 2: Difference + cumulative mean normalised difference
  const yinBuffer = new Float32Array(halfBuffer);
  yinBuffer[0] = 1;

  for (let tau = 1; tau < halfBuffer; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBuffer; i++) {
      const delta = audioBuffer[i] - audioBuffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  let runningSum = 0;
  for (let tau = 1; tau < halfBuffer; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum;
  }

  // Step 3: Absolute threshold
  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (yinBuffer[tau] < threshold) {
      // Find local minimum
      while (tau + 1 <= tauMax && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate === -1) return { pitch_hz: null, pitch_confidence: 0 };

  // Step 4: Parabolic interpolation
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < halfBuffer - 1) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterTau = tauEstimate + (s2 - s0) / denom;
  }

  return {
    pitch_hz: sampleRate / betterTau,
    pitch_confidence: Math.max(0, Math.min(1, 1 - yinBuffer[tauEstimate])),
  };
}
