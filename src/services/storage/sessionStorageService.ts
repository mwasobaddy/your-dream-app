import { db } from "@/lib/dexie/db";
import type { SightSession, StepName } from "@/types/session";

// Service Pattern — all DB operations isolated here.
// Components and hooks must NEVER call db directly.

export const sessionStorageService = {
  async create(session: Omit<SightSession, "id">): Promise<number> {
    return db.sessions.add(session as SightSession);
  },

  async updateStep<K extends StepName>(
    sessionId: string,
    stepName: K,
    stepData: SightSession["steps"][K]
  ): Promise<void> {
    const record = await db.sessions
      .where("session_id")
      .equals(sessionId)
      .first();
    if (!record?.id) throw new Error(`Session ${sessionId} not found`);

    const nextSteps = { ...record.steps, [stepName]: stepData };
    await db.sessions.update(record.id, { steps: nextSteps });
  },

  async complete(sessionId: string, endTimestampIso: string): Promise<void> {
    const record = await db.sessions
      .where("session_id")
      .equals(sessionId)
      .first();
    if (!record?.id) throw new Error(`Session ${sessionId} not found`);
    await db.sessions.update(record.id, {
      status: "completed",
      session_completion: true,
      timestamp_end_iso: endTimestampIso,
    });
  },

  async getAll(): Promise<SightSession[]> {
    return db.sessions
      .orderBy("timestamp_start_iso")
      .reverse()
      .toArray();
  },

  async getById(sessionId: string): Promise<SightSession | undefined> {
    return db.sessions.where("session_id").equals(sessionId).first();
  },

  async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    if (!navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  },

  async deleteSession(sessionId: string): Promise<void> {
    await db.sessions.where("session_id").equals(sessionId).delete();
  },

  async deleteAll(): Promise<void> {
    await db.sessions.clear();
  },
};
