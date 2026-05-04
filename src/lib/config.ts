// Centralised app configuration.
// In Next.js these were NEXT_PUBLIC_* env vars; on Vite they live as constants
// here so the values are still locked for research reproducibility.

export const APP_CONFIG = {
  APP_NAME: "S.I.G.H.T",
  APP_VERSION: "0.1.0",
  SCHEMA_VERSION: 1 as const,
} as const;

export const YIN_CONFIG = {
  SAMPLE_RATE: 44100,
  BUFFER_SIZE: 2048,
  PITCH_FLOOR_HZ: 80,
  PITCH_CEILING_HZ: 400,
  THRESHOLD: 0.2,
} as const;

export const QUALITY_GATE = {
  MIN_SNR_DB: 10,
  MIN_VOICED_FRAMES_RATIO: 0.35,
} as const;

export const PACER = {
  PHASE_DURATION_MS: 4000,
} as const;

/** Ground & Heal pass/fail thresholds used on the summary review tiles. */
export const GROUND_HEAL_THRESHOLDS = {
  /** Adherence ratio (0-1). >= GOOD = green, >= MARGINAL = amber, below = red. */
  ADHERENCE: { GOOD: 0.75, MARGINAL: 0.4 },
  /** Hold duration in ms. */
  HOLD_MS: { GOOD: 5000, MARGINAL: 3000 },
  /** Release velocity in ms (lower = faster/smoother). */
  RELEASE_MS: { GOOD: 30, MARGINAL: 80 },
} as const;

export const CAPTURE = {
  /** How long a single voice capture runs, in ms. */
  DURATION_MS: 4000,
};

export const FEATURE_FLAGS = {
  ENABLE_JSON_EXPORT: true,
  ENABLE_RESEARCH_MODE: false,
};
