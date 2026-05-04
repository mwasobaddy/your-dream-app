import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Activity,
  Wind,
  Hand,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { TacticalShell } from "@/components/layout/TacticalShell";
import { Button } from "@/components/ui/button";
import { ExportPanel } from "@/components/export/ExportPanel";
import { sessionStorageService } from "@/services/storage/sessionStorageService";
import { useSessionStore } from "@/stores/sessionStore";
import type { SightSession } from "@/types/session";
import { cn } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const sec = ms / 1000;
  return sec < 60 ? `${sec.toFixed(1)}s` : `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function formatValidity(val: string | undefined): { label: string; valid: boolean } {
  switch (val) {
    case "valid":
      return { label: "Valid", valid: true };
    case "invalid_snr":
      return { label: "Low SNR", valid: false };
    case "invalid_frames":
      return { label: "Insufficient frames", valid: false };
    case "permission_denied":
      return { label: "Permission denied", valid: false };
    case "skipped":
      return { label: "Skipped", valid: false };
    default:
      return { label: "—", valid: false };
  }
}

function formatDelta(val: number | null, unit: string, higherIs: "relaxed" | "activated"): {
  text: string;
  positive: boolean | null; // null = no value
  directional: "down" | "up" | null;
} {
  if (val === null) return { text: "—", positive: null, directional: null };
  const relaxedNegative = higherIs === "relaxed";
  const isNegative = val < 0;
  const isPositive = val > 0;
  const sign = val >= 0 ? "+" : "";
  return {
    text: `${sign}${val.toFixed(1)} ${unit}`,
    positive: isPositive ? true : isNegative ? false : null,
    directional: isPositive ? "up" : isNegative ? "down" : null,
  };
}

const STEP_CONFIG = [
  {
    key: "scan" as const,
    icon: ListChecks,
    title: "Scan",
    subtitle: "Body awareness",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    key: "identify" as const,
    icon: Activity,
    title: "Identify",
    subtitle: "Voice baseline",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    key: "ground_heal" as const,
    icon: Wind,
    title: "Ground & Heal",
    subtitle: "Breathing exercise",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "track" as const,
    icon: BarChart3,
    title: "Track",
    subtitle: "Voice delta",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
] as const;

// ── Page ────────────────────────────────────────────────────────────

const SessionSummaryPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SightSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { resetSession } = useSessionStore();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    sessionStorageService
      .getById(sessionId)
      .then((s) => setSession(s ?? null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Clean up session store on mount so a new session can begin
  useEffect(() => {
    resetSession();
  }, [resetSession]);

  if (loading) {
    return (
      <TacticalShell>
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
      </TacticalShell>
    );
  }

  if (!session) {
    return (
      <TacticalShell>
        <div className="space-y-4 py-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Session not found</p>
          <p className="text-sm text-muted-foreground">
            This session may have been deleted or doesn't exist.
          </p>
          <Button onClick={() => navigate("/history")} variant="outline" size="sm">
            Go to history
          </Button>
        </div>
      </TacticalShell>
    );
  }

  const steps = session.steps;
  const now = new Date().getTime();
  const start = new Date(session.timestamp_start_iso).getTime();
  const totalDuration = session.timestamp_end_iso
    ? new Date(session.timestamp_end_iso).getTime() - start
    : now - start;

  return (
    <TacticalShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-8"
      >
        {/* ── Header ── */}
        <header className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Session complete</h2>
          <p className="text-sm text-muted-foreground">
            You noticed, named, settled, and verified. That's the S.I.G.H.T loop, and it gets faster with time. Your data, always your choice, your device.
          </p>
        </header>

        {/* ── Session meta card ── */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              {session.session_id.slice(0, 8)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                session.session_completion
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              )}
            >
              {session.session_completion ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {session.status.replace("_", " ")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">{formatTimestamp(session.timestamp_start_iso)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{formatDuration(totalDuration)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Device</p>
              <p className="font-medium">{session.device_metadata?.platform || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">App version</p>
              <p className="font-medium">v{session.app_version}</p>
            </div>
          </div>
        </div>

        {/* ── Step cards ── */}
        {STEP_CONFIG.map((stepCfg) => {
          const data = steps[stepCfg.key];
          return (
            <StepCard key={stepCfg.key} config={stepCfg} data={data} session={session} />
          );
        })}

        {/* ── Actions ── */}
        <div className="space-y-3 pt-2">
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export & next steps
            </h3>
            <p className="text-xs text-muted-foreground">
              Download your session report or return to history.
            </p>
            <ExportPanel session={session} variant="page" />
          </div>

          <Button
            onClick={() => navigate("/history")}
            size="lg"
            className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95 h-12"
          >
            View all sessions
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground"
            >
              Start a new session
            </Button>
          </div>
        </div>
      </motion.div>
    </TacticalShell>
  );
};

// ── Step card ───────────────────────────────────────────────────────

function StepCard({
  config,
  data,
  session,
}: {
  config: (typeof STEP_CONFIG)[number];
  data: SightSession["steps"][keyof SightSession["steps"]];
  session: SightSession;
}) {
  const Icon = config.icon;
  const present = !!data;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm space-y-4",
        present ? "bg-card border-border/60" : "bg-muted/30 border-dashed border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("grid h-8 w-8 place-items-center rounded-lg", config.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{config.title}</p>
            <p className="text-[10px] text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        {present ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <span className="text-[10px] text-muted-foreground">Not completed</span>
        )}
      </div>

      {/* Step-specific content */}
      {renderStepContent(config.key, session)}
    </div>
  );
}

function renderStepContent(
  step: (typeof STEP_CONFIG)[number]["key"],
  session: SightSession
) {
  const steps = session.steps;

  switch (step) {
    case "scan": {
      const s = steps.scan;
      if (!s)
        return <p className="text-xs text-muted-foreground">No body regions selected.</p>;
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Regions selected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {s.body_regions_selected.length > 0 ? (
                s.body_regions_selected.map((r) => (
                  <span
                    key={r}
                    className="inline-block rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 text-[11px] font-medium"
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <MetaRow label="Duration" value={formatDuration(s.duration_ms)} />
        </div>
      );
    }

    case "identify": {
      const s = steps.identify;
      if (!s)
        return <p className="text-xs text-muted-foreground">No identify data captured.</p>;
      const validity = formatValidity(s.voice_prosody_baseline?.validity);
      return (
        <div className="space-y-3">
          <MetaRow label="Emotional state" value={s.state_selected} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Voice baseline
            </p>
            <div className="space-y-1.5">
              <MetaRow
                label="Validity"
                value={validity.label}
                valueClass={validity.valid ? "text-success" : "text-destructive"}
              />
              <MetaRow
                label="Pitch (mean)"
                value={
                  s.voice_prosody_baseline?.pitch_mean_hz != null
                    ? `${s.voice_prosody_baseline.pitch_mean_hz.toFixed(1)} Hz`
                    : "—"
                }
              />
              <MetaRow
                label="Pitch (SD)"
                value={
                  s.voice_prosody_baseline?.pitch_sd_hz != null
                    ? `${s.voice_prosody_baseline.pitch_sd_hz.toFixed(1)} Hz`
                    : "—"
                }
              />
              <MetaRow
                label="RMS Energy"
                value={
                  s.voice_prosody_baseline?.energy_rms_db != null
                    ? `${s.voice_prosody_baseline.energy_rms_db.toFixed(1)} dB`
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      );
    }

    case "ground_heal": {
      const s = steps.ground_heal;
      if (!s)
        return <p className="text-xs text-muted-foreground">No ground & heal data captured.</p>;
      return (
        <div className="space-y-3">
          <MetaRow
            label="Adherence"
            value={`${Math.round(s.ground_adherence_ratio * 100)}%`}
          />
          <MetaRow
            label="Hold duration"
            value={formatDuration(s.heal_hold_duration_ms)}
          />
          <MetaRow
            label="Release velocity"
            value={`${s.heal_release_velocity_ms}ms`}
          />
        </div>
      );
    }

    case "track": {
      const s = steps.track;
      if (!s)
        return <p className="text-xs text-muted-foreground">No track data captured.</p>;
      const postValidity = formatValidity(s.voice_prosody_post?.validity);
      const delta = s.voice_delta;
      const pitch = formatDelta(delta?.pitch_delta_hz ?? null, "Hz", "relaxed");
      const energy = formatDelta(delta?.energy_delta_db ?? null, "dB", "relaxed");

      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Voice delta
            </p>
            <div className="space-y-1.5">
              <MetaRow
                label="Computable"
                value={delta?.computable ? "Yes" : "No"}
                valueClass={delta?.computable ? "text-success" : "text-muted-foreground"}
              />
              <MetaRow
                label="Post-capture validity"
                value={postValidity.label}
                valueClass={postValidity.valid ? "text-success" : "text-destructive"}
              />
              {delta?.computable ? (
                <>
                  <DeltaRow
                    label="Pitch change"
                    text={pitch.text}
                    directional={pitch.directional}
                    positive={pitch.positive}
                  />
                  <DeltaRow
                    label="Energy change"
                    text={energy.text}
                    directional={energy.directional}
                    positive={energy.positive}
                  />
                  <p className="text-[10px] text-muted-foreground italic pt-1">
                    Negative values suggest relaxation. Positive values suggest activation.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ── Sub-components ──────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

function DeltaRow({
  label,
  text,
  directional,
  positive,
}: {
  label: string;
  text: string;
  directional: "up" | "down" | null;
  positive: boolean | null;
}) {
  // For higherIs="relaxed": positive delta = bad (destructive), negative = good (success)
  let colorClass = "text-muted-foreground";
  if (positive === true) colorClass = "text-destructive";
  else if (positive === false) colorClass = "text-success";

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>
        {directional === "up" && "↑ "}
        {directional === "down" && "↓ "}
        {text}
      </span>
    </div>
  );
}

export default SessionSummaryPage;
