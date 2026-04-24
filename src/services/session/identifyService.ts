import { sessionStorageService } from "@/services/storage/sessionStorageService";
import type { IdentifyStepData, VoiceProsodyFeatures } from "@/types/session";

export const identifyService = {
  async save(
    sessionId: string,
    stateSelected: string,
    prosody: VoiceProsodyFeatures
  ): Promise<IdentifyStepData> {
    const data: IdentifyStepData = {
      state_selected: stateSelected,
      voice_prosody_baseline: prosody,
      timestamp_iso: new Date().toISOString(),
    };
    await sessionStorageService.updateStep(sessionId, "identify", data);
    return data;
  },
};
