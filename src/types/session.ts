// Single source of truth for SIGHT Lab session data shapes.
// Any change here is a schema change — bump SchemaVersion and add a Dexie migration.

export type SchemaVersion = 1;
export type StepName = "scan" | "identify" | "ground_heal" | "track";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type CaptureValidity =
  | "valid"
  | "invalid_snr"
  | "invalid_frames"
  | "permission_denied"
  | "skipped";

// ── Scan Step ──────────────────────────────────────────────────────
export interface ScanStepData {
  body_regions_selected: string[];
  timestamp_iso: string;
  duration_ms: number;
}

// ── Identify Step ─────────────────────────────────────────────────
export interface YINParameters {
  sample_rate: number;
  buffer_size: number;
  pitch_floor_hz: number;
  pitch_ceiling_hz: number;
  threshold: number;
}

export interface VoiceProsodyFeatures {
  pitch_mean_hz: number | null;
  pitch_sd_hz: number | null;
  energy_rms_db: number | null;
  validity: CaptureValidity;
  yin_params: YINParameters;
}

export interface IdentifyStepData {
  state_selected: string;
  voice_prosody_baseline: VoiceProsodyFeatures;
  timestamp_iso: string;
}

// ── Ground / Heal Step ────────────────────────────────────────────
export interface PacerPhaseTimestamps {
  inhale_start_ms: number;
  hold1_start_ms: number;
  exhale_start_ms: number;
  hold2_start_ms: number;
  cycle_end_ms: number;
}

export interface GroundHealStepData {
  pacer_phase_timestamps: PacerPhaseTimestamps;
  ground_adherence_ratio: number;
  heal_press_start_ms: number;
  heal_hold_duration_ms: number;
  heal_release_velocity_ms: number;
  timestamp_iso: string;
}

// ── Track Step ────────────────────────────────────────────────────
export interface VoiceDelta {
  pitch_delta_hz: number | null;
  energy_delta_db: number | null;
  computable: boolean;
}

export interface TrackStepData {
  voice_prosody_post: VoiceProsodyFeatures;
  voice_delta: VoiceDelta;
  timestamp_iso: string;
}

// ── Full Session Record ───────────────────────────────────────────
export interface DeviceMetadata {
  user_agent: string;
  platform: string;
  screen_width: number;
  screen_height: number;
}

export interface SightSession {
  id?: number;
  session_id: string;
  device_uuid: string;
  schema_version: SchemaVersion;
  app_version: string;
  device_metadata: DeviceMetadata;
  timestamp_start_iso: string;
  timestamp_end_iso: string | null;
  status: SessionStatus;
  steps: {
    scan: ScanStepData | null;
    identify: IdentifyStepData | null;
    ground_heal: GroundHealStepData | null;
    track: TrackStepData | null;
  };
  session_completion: boolean;
}
