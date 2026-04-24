import { sessionStorageService } from "@/services/storage/sessionStorageService";
import type { GroundHealStepData, PacerPhaseTimestamps } from "@/types/session";

export interface GroundHealMetrics {
  pacer_phase_timestamps: PacerPhaseTimestamps;
  ground_adherence_ratio: number;
  heal_press_start_ms: number;
  heal_hold_duration_ms: number;
  heal_release_velocity_ms: number;
}

export const groundHealService = {
  async save(
    sessionId: string,
    metrics: GroundHealMetrics
  ): Promise<GroundHealStepData> {
    const data: GroundHealStepData = {
      ...metrics,
      timestamp_iso: new Date().toISOString(),
    };
    await sessionStorageService.updateStep(sessionId, "ground_heal", data);
    return data;
  },
};
