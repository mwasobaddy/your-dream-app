// JSON Export Service
// Serialises a single session or all sessions to a downloadable JSON bundle.
// Includes schema_version for forward compatibility.

import type { SightSession } from '@/types/session';

export const jsonExportService = {
  /**
   * Export a single session as a downloadable JSON file.
   * Triggers a browser download — no server call, no network request.
   */
  downloadSession(session: SightSession): void {
    const bundle = {
      exported_at: new Date().toISOString(),
      app: 'SIGHT Lab',
      app_version: session.app_version,
      schema_version: session.schema_version,
      session_count: 1,
      sessions: [session],
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });

    this._triggerDownload(blob, `SIGHT-session-${session.session_id.slice(0, 8)}.json`);
  },

  /**
   * Export all sessions as a downloadable JSON bundle.
   */
  downloadAll(sessions: SightSession[]): void {
    if (sessions.length === 0) return;

    const bundle = {
      exported_at: new Date().toISOString(),
      app: 'SIGHT Lab',
      app_version: sessions[0].app_version,
      schema_version: sessions[0].schema_version,
      session_count: sessions.length,
      sessions,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });

    this._triggerDownload(blob, `SIGHT-all-sessions-${Date.now()}.json`);
  },

  _triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
