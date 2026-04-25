import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, FileDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StepProgress } from "@/components/session/StepProgress";
import { StepGuard } from "@/components/layout/StepGuard";
import { VoiceCapture } from "@/components/session/VoiceCapture";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { trackService } from "@/services/session/trackService";
import { sessionStorageService } from "@/services/storage/sessionStorageService";
import { ExportPanel } from "@/components/export/ExportPanel";
import { YIN_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { SightSession, VoiceProsodyFeatures, TrackStepData, VoiceDelta } from "@/types/session";
import { toast } from "sonner";

const SKIPPED_PROSODY: VoiceProsodyFeatures = {
  pitch_mean_hz: null,
  pitch_sd_hz: null,
  energy_rms_db: null,
  validity: "skipped",
  yin_params: {
    sample_rate: YIN_CONFIG.SAMPLE_RATE,
    buffer_size: YIN_CONFIG.BUFFER_SIZE,
    pitch_floor_hz: YIN_CONFIG.PITCH_FLOOR_HZ,
    pitch_ceiling_hz: YIN_CONFIG.PITCH_CEILING_HZ,
    threshold: YIN_CONFIG.THRESHOLD,
  },
};

const TrackInner = () => {
  const navigate = useNavigate();
  const { activeSessionId, advanceStep } = useSessionStore();
  const [postProsody, setPostProsody] = useState<VoiceProsodyFeatures | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ trackData: TrackStepData; delta: VoiceDelta } | null>(null);

  // Sync step status on mount
  useEffect(() => {
    useSessionStore.setState({ currentStep: "track" });
  }, []);

  const handleSave = async () => {
    if (!activeSessionId || !postProsody) return;
    setSaving(true);
    try {
      const { trackData } = await trackService.save(activeSessionId, postProsody);
      setResult({ trackData, delta: trackData.voice_delta });
      advanceStep("track");
      toast.success("Session complete", {
        description: "All four steps have been recorded.",
      });
      // Mark the session as completed in Dexie
      await sessionStorageService.complete(activeSessionId, new Date().toISOString());
      navigate(`/session/summary/${activeSessionId}`);
    } catch (err) {
      toast.error("Could not save track data", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!postProsody;

  // Show result card after capture
  const showResult = postProsody && !canSave;

  return (
    <AppShell>
      <StepProgress />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Track</h2>
          <p className="text-sm text-muted-foreground">
            Let's check in and see how your voice has changed after the breathing exercise.
          </p>
        </header>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1. Voice check-in
          </h3>
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <VoiceCapture
              onCaptured={setPostProsody}
              onSkip={() => setPostProsody(SKIPPED_PROSODY)}
              promptText="Hold the button and say the same phrase you said during Identify. Release when done."
            />
          </div>
        </section>

        {/* Delta result card — shown after capture */}
        {result && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Voice delta
            </h3>
            <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm space-y-4">
              {result.delta.computable ? (
                <>
                  <DeltaRow
                    label="Pitch change"
                    value={result.delta.pitch_delta_hz ?? null}
                    unit="Hz"
                    higherIs="relaxed"
                  />
                  <DeltaRow
                    label="Energy change"
                    value={result.delta.energy_delta_db ?? null}
                    unit="dB"
                    higherIs="relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    Negative values suggest relaxation. Positive values suggest activation.
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>
                    Delta could not be computed because one or both voice captures
                    had insufficient quality.
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Export option before saving */}
        {result && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Export (optional)
            </h3>
            <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
              <p className="text-xs text-muted-foreground mb-3">
                Download your session report before saving.
              </p>
              <SessionExport sessionId={activeSessionId!} />
            </div>
          </section>
        )}

        <Button
          onClick={handleSave}
          disabled={!canSave || saving}
          size="lg"
          className="w-full bg-gradient-teal text-teal-foreground hover:opacity-95 h-12"
        >
          {saving ? "Saving…" : "Save & finish session"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          Once saved, this session will appear in your history.
        </p>
      </motion.div>
    </AppShell>
  );
};

function DeltaRow({
  label,
  value,
  unit,
  higherIs,
}: {
  label: string;
  value: number | null;
  unit: string;
  higherIs: "relaxed" | "activated";
}) {
  if (value === null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">—</span>
      </div>
    );
  }

  const isNegative = value < 0;
  const isPositive = value > 0;
  const relaxedDirection = higherIs === "relaxed" ? "negative" : "positive";
  const colorClass = isNegative
    ? relaxedDirection === "negative"
      ? "text-success"
      : "text-destructive"
    : isPositive
      ? relaxedDirection === "positive"
        ? "text-success"
        : "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-semibold tabular-nums", colorClass)}>
        {value >= 0 ? "+" : ""}
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

/** Loads a session by ID and renders the ExportPanel. */
function SessionExport({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SightSession | null>(null);
  useEffect(() => {
    if (!sessionId) return;
    sessionStorageService.getById(sessionId).then(setSession);
  }, [sessionId]);
  if (!session) return null;
  return <ExportPanel session={session} variant="page" />;
}

const TrackPage = () => (
  <StepGuard step="track">
    <TrackInner />
  </StepGuard>
);

export default TrackPage;
