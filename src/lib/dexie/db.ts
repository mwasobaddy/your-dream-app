import Dexie, { type Table } from "dexie";
import type { SightSession } from "@/types/session";

export class SightLabDatabase extends Dexie {
  sessions!: Table<SightSession>;

  constructor() {
    super("SightLabDB");

    // ── Schema Version 1 ──────────────────────────────────────────
    // CRITICAL: Never modify a version once deployed.
    // Always add a new .version() block for changes.
    this.version(1).stores({
      sessions:
        "++id, session_id, device_uuid, timestamp_start_iso, status, session_completion",
    });
  }
}

export const db = new SightLabDatabase();
