// CSV Export Service
// Serialises session data to CSV using papaparse (unparse).
// Each session becomes one row with flattened prosody and delta fields.

import Papa from 'papaparse';
import type { SightSession } from '@/types/session';

type FlatSessionRow = Record<string, string | number | null>;

function flattenSession(s: SightSession): FlatSessionRow {
  return {
    session_id: s.session_id.slice(0, 8),
    device_uuid: s.device_uuid,
    schema_version: s.schema_version,
    app_version: s.app_version,
    platform: s.device_metadata?.platform || '',
    screen: s.device_metadata
      ? `${s.device_metadata.screen_width}x${s.device_metadata.screen_height}`
      : '',
    started_at: s.timestamp_start_iso,
    ended_at: s.timestamp_end_iso || '',
    status: s.status,
    completed: s.session_completion ? 'yes' : 'no',

    // Scan
    scan_regions: s.steps.scan?.body_regions_selected?.join('; ') || '',
    scan_duration_ms: s.steps.scan?.duration_ms ?? null,

    // Identify
    identify_state: s.steps.identify?.state_selected || '',
    baseline_pitch_mean_hz: s.steps.identify?.voice_prosody_baseline?.pitch_mean_hz ?? null,
    baseline_pitch_sd_hz: s.steps.identify?.voice_prosody_baseline?.pitch_sd_hz ?? null,
    baseline_energy_rms_db: s.steps.identify?.voice_prosody_baseline?.energy_rms_db ?? null,
    baseline_validity: s.steps.identify?.voice_prosody_baseline?.validity || '',

    // Ground / Heal
    ground_adherence_pct: s.steps.ground_heal?.ground_adherence_ratio != null
      ? (s.steps.ground_heal!.ground_adherence_ratio! * 100).toFixed(1)
      : null,
    heal_hold_duration_ms: s.steps.ground_heal?.heal_hold_duration_ms ?? null,
    heal_release_velocity_ms: s.steps.ground_heal?.heal_release_velocity_ms ?? null,

    // Track (post)
    post_pitch_mean_hz: s.steps.track?.voice_prosody_post?.pitch_mean_hz ?? null,
    post_pitch_sd_hz: s.steps.track?.voice_prosody_post?.pitch_sd_hz ?? null,
    post_energy_rms_db: s.steps.track?.voice_prosody_post?.energy_rms_db ?? null,
    post_validity: s.steps.track?.voice_prosody_post?.validity || '',

    // Delta
    delta_computable: s.steps.track?.voice_delta?.computable ? 'yes' : 'no',
    pitch_delta_hz: s.steps.track?.voice_delta?.pitch_delta_hz ?? null,
    energy_delta_db: s.steps.track?.voice_delta?.energy_delta_db ?? null,
  };
}

export const csvExportService = {
  /**
   * Export a single session as a downloadable CSV file.
   */
  downloadSession(session: SightSession): void {
    const rows = [flattenSession(session)];
    this._downloadRows(rows, `SIGHT-session-${session.session_id.slice(0, 8)}.csv`);
  },

  /**
   * Export all sessions as a downloadable CSV file.
   */
  downloadAll(sessions: SightSession[]): void {
    if (sessions.length === 0) return;
    const rows = sessions.map(flattenSession);
    this._downloadRows(rows, `SIGHT-all-sessions-${Date.now()}.csv`);
  },

  _downloadRows(rows: FlatSessionRow[], filename: string): void {
    const csv = Papa.unparse(rows, {
      header: true,
      skipEmptyLines: true,
    });

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

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
