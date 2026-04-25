// Pure HTML string builder for PDF export content.
// No browser APIs, no React — just string concatenation.
// This runs in the browser only, so we can inline styles.

import type { SightSession } from '@/types/session';

export const PRIVACY_DISCLAIMER = `
  Data in this report was processed entirely on-device.
  No PII is collected, transmitted, or stored externally.
`.trim();

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatValue(val: number | null, unit: string = ''): string {
  if (val === null || val === undefined) return '—';
  return `${val.toFixed(1)}${unit ? ' ' + unit : ''}`;
}

function formatValidity(validity: string): string {
  const labels: Record<string, string> = {
    valid: 'Valid',
    invalid_snr: 'Low SNR',
    invalid_frames: 'Insufficient voiced frames',
    permission_denied: 'Permission denied',
    skipped: 'Skipped',
  };
  return labels[validity] || validity;
}

function prosodyTable(prosody: { pitch_mean_hz: number | null; pitch_sd_hz: number | null; energy_rms_db: number | null; validity: string } | null): string {
  if (!prosody) return '<p class="muted">No voice data captured.</p>';
  return `
    <table>
      <tr><td>Validity</td><td>${formatValidity(prosody.validity)}</td></tr>
      <tr><td>Pitch (mean)</td><td>${formatValue(prosody.pitch_mean_hz, 'Hz')}</td></tr>
      <tr><td>Pitch (SD)</td><td>${formatValue(prosody.pitch_sd_hz, 'Hz')}</td></tr>
      <tr><td>RMS Energy</td><td>${formatValue(prosody.energy_rms_db, 'dB')}</td></tr>
    </table>
  `;
}

export function buildReportHTML(session: SightSession): string {
  const { steps } = session;

  const scanRegions = steps.scan?.body_regions_selected?.join(', ') || 'None selected';
  const scanDuration = steps.scan?.duration_ms ? `${steps.scan.duration_ms}ms` : '—';

  const identifyState = steps.identify?.state_selected || '—';

  const groundAdherence = steps.ground_heal?.ground_adherence_ratio !== null
    ? `${(steps.ground_heal!.ground_adherence_ratio! * 100).toFixed(0)}%`
    : '—';
  const groundHold = formatValue(steps.ground_heal?.heal_hold_duration_ms, 'ms');

  const deltaPitch = formatValue(steps.track?.voice_delta?.pitch_delta_hz, 'Hz');
  const deltaEnergy = formatValue(steps.track?.voice_delta?.energy_delta_db, 'dB');
  const deltaComputable = steps.track?.voice_delta?.computable
    ? 'Yes (both captures valid)'
    : 'No (one or both captures invalid/skipped)';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    padding: 10mm;
    line-height: 1.5;
  }
  h1 {
    font-size: 18pt;
    color: #028090;
    margin-bottom: 4px;
  }
  h2 {
    font-size: 13pt;
    color: #1B2A4A;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 3px;
    margin-top: 20px;
  }
  h3 {
    font-size: 11pt;
    color: #374151;
    margin-top: 14px;
  }
  .meta {
    font-size: 9pt;
    color: #6b7280;
    margin-bottom: 16px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 12px 0;
    font-size: 10pt;
  }
  td {
    padding: 4px 8px;
    border-bottom: 1px solid #e5e7eb;
  }
  td:first-child {
    font-weight: 600;
    width: 40%;
    color: #374151;
  }
  td:last-child {
    color: #1a1a2e;
  }
  .muted {
    color: #9ca3af;
    font-style: italic;
  }
  .disclaimer {
    margin-top: 28px;
    padding: 10px;
    border: 1px solid #fde68a;
    background: #fffbeb;
    font-size: 8.5pt;
    color: #92400e;
    border-radius: 4px;
    text-align: center;
  }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 500;
    background: #e5e7eb;
    color: #374151;
  }
</style>
</head>
<body>
  <h1>SIGHT Lab — Session Report</h1>
  <div class="meta">
    <strong>Session ID:</strong> ${session.session_id.slice(0, 8)}&nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Started:</strong> ${formatTimestamp(session.timestamp_start_iso)}&nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Status:</strong> <span class="status-badge status-completed">${session.status}</span>
  </div>
  <div class="meta">
    <strong>Device:</strong> ${session.device_metadata?.platform || '—'} &middot;
    ${session.device_metadata?.screen_width || '?'}×${session.device_metadata?.screen_height || '?'} &middot;
    <strong>App:</strong> v${session.app_version} &middot; Schema v${session.schema_version}
  </div>

  <h2>1. Scan — Body Awareness</h2>
  <table>
    <tr><td>Body regions selected</td><td>${scanRegions}</td></tr>
    <tr><td>Duration</td><td>${scanDuration}</td></tr>
    <tr><td>Timestamp</td><td>${formatTimestamp(steps.scan?.timestamp_iso || null)}</td></tr>
  </table>

  <h2>2. Identify — Baseline Voice Prosody</h2>
  <table>
    <tr><td>Emotional state</td><td>${identifyState}</td></tr>
    <tr><td>Timestamp</td><td>${formatTimestamp(steps.identify?.timestamp_iso || null)}</td></tr>
  </table>
  <h3>Voice baseline</h3>
  ${prosodyTable(steps.identify?.voice_prosody_baseline || null)}

  <h2>3. Ground / Heal — Breathing Exercise</h2>
  <table>
    <tr><td>Adherence</td><td>${groundAdherence}</td></tr>
    <tr><td>Press-hold duration</td><td>${groundHold}</td></tr>
    <tr><td>Release velocity</td><td>${formatValue(steps.ground_heal?.heal_release_velocity_ms, 'ms')}</td></tr>
    <tr><td>Timestamp</td><td>${formatTimestamp(steps.ground_heal?.timestamp_iso || null)}</td></tr>
  </table>

  <h2>4. Track — Voice Delta</h2>
  <h3>Voice post-intervention</h3>
  ${prosodyTable(steps.track?.voice_prosody_post || null)}
  <h3>Delta</h3>
  <table>
    <tr><td>Computable</td><td>${deltaComputable}</td></tr>
    <tr><td>Pitch change</td><td>${deltaPitch}</td></tr>
    <tr><td>Energy change</td><td>${deltaEnergy}</td></tr>
    <tr><td>Timestamp</td><td>${formatTimestamp(steps.track?.timestamp_iso || null)}</td></tr>
  </table>

  <div class="disclaimer">${PRIVACY_DISCLAIMER}</div>
</body>
</html>
  `.trim();
}
