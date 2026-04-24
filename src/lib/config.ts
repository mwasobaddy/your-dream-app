// Centralised app configuration.
// In Next.js these were NEXT_PUBLIC_* env vars; on Vite they live as constants
// here so the values are still locked for research reproducibility.

export const APP_CONFIG = {
  APP_NAME: "SIGHT Lab",
  APP_VERSION: "0.1.0",
  SCHEMA_VERSION: 1 as const,
} as const;

export const YIN_CONFIG = {
  SAMPLE_RATE: 44100,
  BUFFER_SIZE: 2048,
  PITCH_FLOOR_HZ: 80,
  PITCH_CEILING_HZ: 400,
  THRESHOLD: 0.1,
} as const;

export const QUALITY_GATE = {
  MIN_SNR_DB: 10,
  MIN_VOICED_FRAMES_RATIO: 0.6,
} as const;

export const PACER = {
  PHASE_DURATION_MS: 4000,
} as const;

export const CAPTURE = {
  /** How long a single voice capture runs, in ms. */
  DURATION_MS: 4000,
};

export const FEATURE_FLAGS = {
  ENABLE_JSON_EXPORT: true,
  ENABLE_RESEARCH_MODE: false,
};
