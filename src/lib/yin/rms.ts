/** Root-mean-square energy in dBFS (full-scale = 0 dB). Returns -Infinity on silence. */
export function computeRMSdb(buffer: Float32Array): number {
  if (buffer.length === 0) return -Infinity;
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumSquares / buffer.length);
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

/** Approximate SNR: ratio of mean voiced-frame energy to mean silent-frame energy. */
export function estimateSNRdb(frameEnergiesDb: number[]): number {
  if (frameEnergiesDb.length === 0) return 0;
  const sorted = [...frameEnergiesDb].sort((a, b) => a - b);
  const noiseFloor =
    sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.2))).reduce((a, b) => a + b, 0) /
    Math.max(1, Math.floor(sorted.length * 0.2));
  const signal =
    sorted
      .slice(-Math.max(1, Math.floor(sorted.length * 0.2)))
      .reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(sorted.length * 0.2));
  return signal - noiseFloor;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}
