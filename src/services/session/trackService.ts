import { sessionStorageService } from "@/services/storage/sessionStorageService";
import { computeVoiceDelta } from "@/lib/session/deltaCalculator";
import type {
  IdentifyStepData,
  TrackStepData,
  VoiceProsodyFeatures,
} from "@/types/session";

export const trackService = {
  /**
   * Save the post-intervention voice capture, compute the delta against
   * the baseline from the Identify step, and store everything in Dexie.
   *
   * @returns The saved TrackStepData with both post prosody and voice delta.
   */
  async save(
    sessionId: string,
    postProsody: VoiceProsodyFeatures
  ): Promise<{ trackData: TrackStepData; delta: IdentifyStepData }> {
    // Read the session to get the baseline prosody from the Identify step
    const session = await sessionStorageService.getById(sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.steps.identify) throw new Error("Identify step data not found — no baseline to compare against");

    const baseline = session.steps.identify.voice_prosody_baseline;
    const voiceDelta = computeVoiceDelta(baseline, postProsody);

    const trackData: TrackStepData = {
      voice_prosody_post: postProsody,
      voice_delta: voiceDelta,
      timestamp_iso: new Date().toISOString(),
    };

    await sessionStorageService.updateStep(sessionId, "track", trackData);

    return { trackData, delta: session.steps.identify };
  },
};
