import { v4 as uuidv4 } from "uuid";
import { sessionStorageService } from "@/services/storage/sessionStorageService";
import { getOrCreateDeviceUUID, getDeviceMetadata } from "@/lib/identity";
import { APP_CONFIG } from "@/lib/config";
import type { SightSession } from "@/types/session";

/**
 * Creates a fresh in_progress session record and returns its session_id.
 * Components should call this through the orchestrator, never write directly.
 */
export async function startNewSession(): Promise<string> {
  const session_id = uuidv4();
  const now = new Date().toISOString();

  const record: Omit<SightSession, "id"> = {
    session_id,
    device_uuid: getOrCreateDeviceUUID(),
    schema_version: APP_CONFIG.SCHEMA_VERSION,
    app_version: APP_CONFIG.APP_VERSION,
    device_metadata: getDeviceMetadata(),
    timestamp_start_iso: now,
    timestamp_end_iso: null,
    status: "in_progress",
    steps: { scan: null, identify: null, ground_heal: null, track: null },
    session_completion: false,
  };

  await sessionStorageService.create(record);
  return session_id;
}
