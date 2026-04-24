import { sessionStorageService } from "@/services/storage/sessionStorageService";
import type { ScanStepData } from "@/types/session";

export const scanService = {
  async save(
    sessionId: string,
    regions: string[],
    durationMs: number
  ): Promise<ScanStepData> {
    if (regions.length === 0) {
      throw new Error("At least one body region must be selected");
    }
    const data: ScanStepData = {
      body_regions_selected: regions,
      timestamp_iso: new Date().toISOString(),
      duration_ms: durationMs,
    };
    await sessionStorageService.updateStep(sessionId, "scan", data);
    return data;
  },
};
