// PDF Export Service (pdfme)
// Renders session data as a native PDF template using pdfme.
// No DOM rendering, no html2canvas, no jsPDF.
// Each schema field is positioned on an A4 page in mm units.

import { generate } from '@pdfme/generator';
import { CUSTOM_A4_PDF, getDefaultFont } from '@pdfme/common';
import type { SightSession } from '@/types/session';

// ── helpers ──────────────────────────────────────────────────────

function fmt(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleString();
}

function val(n: number | null, unit = ''): string {
  if (n === null || n === undefined) return '\u2014';
  return `${n.toFixed(1)}${unit ? ' ' + unit : ''}`;
}

function validityLabel(v: string): string {
  const map: Record<string, string> = {
    valid: 'Valid',
    invalid_snr: 'Low SNR',
    invalid_frames: 'Insufficient voiced frames',
    permission_denied: 'Permission denied',
    skipped: 'Skipped',
  };
  return map[v] || v;
}

function prosodyContent(p: {
  pitch_mean_hz: number | null;
  pitch_sd_hz: number | null;
  energy_rms_db: number | null;
  validity: string;
} | null): string {
  if (!p) return 'Validity: No voice data captured.';
  return [
    `Validity: ${validityLabel(p.validity)}`,
    `Pitch (mean): ${val(p.pitch_mean_hz, 'Hz')}`,
    `Pitch (SD): ${val(p.pitch_sd_hz, 'Hz')}`,
    `RMS Energy: ${val(p.energy_rms_db, 'dB')}`,
  ].join('\n');
}

// ── A4 layout constants (mm) ─────────────────────────────────────
const M = 15;   // margin
const CW = 180; // content width (210 - 2*15)
const H2 = 7;
const H3 = 6;
const LH = 1.5; // text line-height

// ── Template builder ─────────────────────────────────────────────

function buildPage1Schemas(session: SightSession) {
  const { steps } = session;

  const yBase = M;

  const scanBody = [
    `Body regions: ${steps.scan?.body_regions_selected?.join(', ') || 'None'}`,
    `Duration: ${steps.scan?.duration_ms ? steps.scan.duration_ms + 'ms' : '\u2014'}`,
    `Timestamp: ${fmt(steps.scan?.timestamp_iso || null)}`,
  ].join('\n');

  const identifyBody = [
    `Emotional state: ${steps.identify?.state_selected || '\u2014'}`,
    `Timestamp: ${fmt(steps.identify?.timestamp_iso || null)}`,
  ].join('\n');

  const identifyProsody = prosodyContent(steps.identify?.voice_prosody_baseline || null);

  return [
    // Title
    { name: 'title', type: 'text' as const, position: { x: M, y: yBase }, width: CW, height: 8, fontSize: 16, fontColor: '#028090', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    // Meta line 1
    { name: 'meta1', type: 'text' as const, position: { x: M, y: yBase + 10 }, width: CW, height: 5, fontSize: 9, fontColor: '#6b7280', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    // Meta line 2
    { name: 'meta2', type: 'text' as const, position: { x: M, y: yBase + 15.5 }, width: CW, height: 5, fontSize: 9, fontColor: '#6b7280', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    // Section 1: Scan
    { name: 'h2_scan', type: 'text' as const, position: { x: M, y: yBase + 24 }, width: CW, height: H2, fontSize: 13, fontColor: '#1B2A4A', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'scan_body', type: 'text' as const, position: { x: M, y: yBase + 24 + H2 + 2 }, width: CW, height: 16, fontSize: 10, fontColor: '#1a1a2e', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: LH, characterSpacing: 0 },
    // Section 2: Identify
    { name: 'h2_identify', type: 'text' as const, position: { x: M, y: yBase + 24 + H2 + 2 + 16 + 6 }, width: CW, height: H2, fontSize: 13, fontColor: '#1B2A4A', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'identify_body', type: 'text' as const, position: { x: M, y: yBase + 24 + H2 + 2 + 16 + 6 + H2 + 2 }, width: CW, height: 12, fontSize: 10, fontColor: '#1a1a2e', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: LH, characterSpacing: 0 },
    { name: 'h3_voice', type: 'text' as const, position: { x: M, y: yBase + 24 + H2 + 2 + 16 + 6 + H2 + 2 + 12 + 3 }, width: CW, height: H3, fontSize: 11, fontColor: '#374151', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'identify_prosody', type: 'text' as const, position: { x: M, y: yBase + 24 + H2 + 2 + 16 + 6 + H2 + 2 + 12 + 3 + H3 + 1 }, width: CW, height: 22, fontSize: 10, fontColor: '#1a1a2e', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.6, characterSpacing: 0 },
  ];
}

function buildPage2Schemas(session: SightSession) {
  const { steps } = session;
  const yBase = M;

  const groundBody = [
    `Adherence: ${steps.ground_heal?.ground_adherence_ratio != null ? (steps.ground_heal.ground_adherence_ratio * 100).toFixed(0) + '%' : '\u2014'}`,
    `Press-hold duration: ${val(steps.ground_heal?.heal_hold_duration_ms, 'ms')}`,
    `Release velocity: ${val(steps.ground_heal?.heal_release_velocity_ms, 'ms')}`,
    `Timestamp: ${fmt(steps.ground_heal?.timestamp_iso || null)}`,
  ].join('\n');

  const trackProsody = prosodyContent(steps.track?.voice_prosody_post || null);

  const deltaBody = [
    `Computable: ${steps.track?.voice_delta?.computable ? 'Yes (both valid)' : 'No'}`,
    `Pitch change: ${val(steps.track?.voice_delta?.pitch_delta_hz, 'Hz')}`,
    `Energy change: ${val(steps.track?.voice_delta?.energy_delta_db, 'dB')}`,
    `Timestamp: ${fmt(steps.track?.timestamp_iso || null)}`,
  ].join('\n');

  return [
    { name: 'h2_ground', type: 'text' as const, position: { x: M, y: yBase }, width: CW, height: H2, fontSize: 13, fontColor: '#1B2A4A', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'ground_body', type: 'text' as const, position: { x: M, y: yBase + H2 + 2 }, width: CW, height: 24, fontSize: 10, fontColor: '#1a1a2e', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: LH, characterSpacing: 0 },
    { name: 'h2_track', type: 'text' as const, position: { x: M, y: yBase + H2 + 2 + 24 + 6 }, width: CW, height: H2, fontSize: 13, fontColor: '#1B2A4A', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'h3_post', type: 'text' as const, position: { x: M, y: yBase + H2 + 2 + 24 + 6 + H2 + 2 }, width: CW, height: H3, fontSize: 11, fontColor: '#374151', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'track_prosody', type: 'text' as const, position: { x: M, y: yBase + H2 + 2 + 24 + 6 + H2 + 2 + H3 + 1 }, width: CW, height: 22, fontSize: 10, fontColor: '#1a1a2e', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.6, characterSpacing: 0 },
    { name: 'h3_delta', type: 'text' as const, position: { x: M, y: yBase + H2 + 2 + 24 + 6 + H2 + 2 + H3 + 1 + 22 + 2 }, width: CW, height: H3, fontSize: 11, fontColor: '#374151', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: 1.3, characterSpacing: 0 },
    { name: 'delta_body', type: 'text' as const, position: { x: M, y: yBase + H2 + 2 + 24 + 6 + H2 + 2 + H3 + 1 + 22 + 2 + H3 + 1 }, width: CW, height: 20, fontSize: 10, fontColor: '#1a1a2e', alignment: 'left' as const, verticalAlignment: 'top' as const, lineHeight: LH, characterSpacing: 0 },
    // Disclaimer
    { name: 'disclaimer', type: 'text' as const, position: { x: M, y: 297 - M - 16 }, width: CW, height: 16, fontSize: 8, fontColor: '#92400e', alignment: 'center' as const, verticalAlignment: 'middle' as const, lineHeight: 1.3, characterSpacing: 0 },
  ];
}

function buildInputs(session: SightSession) {
  const { steps, device_metadata } = session;

  const p1 = {
    title: 'SIGHT Report',
    meta1: `Session: ${session.session_id.slice(0, 8)}  |  Started: ${fmt(session.timestamp_start_iso)}  |  ${session.status}`,
    meta2: `Device: ${device_metadata?.platform || '\u2014'} ${device_metadata?.screen_width || '?'}x${device_metadata?.screen_height || '?'}  |  App v${session.app_version}  |  Schema v${session.schema_version}`,
    h2_scan: '1. Scan \u2014 Body Awareness',
    scan_body: [
      `Body regions: ${steps.scan?.body_regions_selected?.join(', ') || 'None'}`,
      `Duration: ${steps.scan?.duration_ms ? steps.scan.duration_ms + 'ms' : '\u2014'}`,
      `Timestamp: ${fmt(steps.scan?.timestamp_iso || null)}`,
    ].join('\n'),
    h2_identify: '2. Identify \u2014 Baseline Voice',
    identify_body: [
      `Emotional state: ${steps.identify?.state_selected || '\u2014'}`,
      `Timestamp: ${fmt(steps.identify?.timestamp_iso || null)}`,
    ].join('\n'),
    h3_voice: 'Voice baseline',
    identify_prosody: prosodyContent(steps.identify?.voice_prosody_baseline || null),
  };

  const p2 = {
    h2_ground: '3. Ground / Heal \u2014 Breathing',
    ground_body: [
      `Adherence: ${steps.ground_heal?.ground_adherence_ratio != null ? (steps.ground_heal.ground_adherence_ratio * 100).toFixed(0) + '%' : '\u2014'}`,
      `Press-hold: ${val(steps.ground_heal?.heal_hold_duration_ms, 'ms')}`,
      `Release velocity: ${val(steps.ground_heal?.heal_release_velocity_ms, 'ms')}`,
      `Timestamp: ${fmt(steps.ground_heal?.timestamp_iso || null)}`,
    ].join('\n'),
    h2_track: '4. Track \u2014 Voice Delta',
    h3_post: 'Voice post-intervention',
    track_prosody: prosodyContent(steps.track?.voice_prosody_post || null),
    h3_delta: 'Delta',
    delta_body: [
      `Computable: ${steps.track?.voice_delta?.computable ? 'Yes' : 'No'}`,
      `Pitch change: ${val(steps.track?.voice_delta?.pitch_delta_hz, 'Hz')}`,
      `Energy change: ${val(steps.track?.voice_delta?.energy_delta_db, 'dB')}`,
      `Timestamp: ${fmt(steps.track?.timestamp_iso || null)}`,
    ].join('\n'),
    disclaimer: 'Data in this report was processed entirely on-device. No PII is collected, transmitted, or stored externally.',
  };

  return [p1, p2];
}

// ── Service ──────────────────────────────────────────────────────

export const pdfExportService = {
  /** Generate a PDF Blob from a session report using pdfme */
  async generateBlob(session: SightSession): Promise<Blob> {
    const template = {
      basePdf: CUSTOM_A4_PDF,
      schemas: [buildPage1Schemas(session), buildPage2Schemas(session)],
    };

    const inputs = buildInputs(session);
    const font = getDefaultFont();

    const uint8array = await generate({ template, inputs, options: { font } });
    return new Blob([uint8array], { type: 'application/pdf' });
  },

  /** Download a single session report as a PDF file */
  async downloadSession(session: SightSession): Promise<void> {
    const blob = await this.generateBlob(session);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sight-session-${session.session_id.slice(0, 8)}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  /**
   * Export all sessions as a single merged PDF.
   * Each session renders on its own set of page(s) — no data is truncated.
   */
  async downloadAll(sessions: SightSession[]): Promise<void> {
    if (sessions.length === 0) return;

    // Generate each session's PDF separately
    const pdfBuffers = await Promise.all(
      sessions.map((s) => this.generateBlob(s).then((b) => b.arrayBuffer())),
    );

    // Merge all pages into one document using @pdfme/pdf-lib
    const { PDFDocument } = await import('@pdfme/pdf-lib');
    const merged = await PDFDocument.create();

    for (const buf of pdfBuffers) {
      const doc = await PDFDocument.load(buf);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }

    const mergedBytes = await merged.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `SIGHT-all-sessions-${Date.now()}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};
