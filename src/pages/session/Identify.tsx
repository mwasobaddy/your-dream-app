import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TacticalShell } from "@/components/layout/TacticalShell";
import { StepProgress } from "@/components/session/StepProgress";
import { StepGuard } from "@/components/layout/StepGuard";
import { StateCardGrid } from "@/components/session/StateCardGrid";
import { VoiceCapture } from "@/components/session/VoiceCapture";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { identifyService } from "@/services/session/identifyService";
import { YIN_CONFIG } from "@/lib/config";
import type { VoiceProsodyFeatures } from "@/types/session";
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

const IdentifyInner = () => {
  const navigate = useNavigate();
  const { activeSessionId, advanceStep } = useSessionStore();
  const [stateId, setStateId] = useState<string | null>(null);
  const [prosody, setProsody] = useState<VoiceProsodyFeatures | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    useSessionStore.setState({ currentStep: "identify" });
  }, []);

  const handleSave = async () => {
    if (!activeSessionId || !stateId || !prosody) return;
    setSaving(true);
    try {
      await identifyService.save(activeSessionId, stateId, prosody);
 advanceStep("identify");
 navigate("/?next=ground_heal");
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!stateId && !!prosody;

  return (
    <TacticalShell>
      <StepProgress />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Identify</h2>
          <p className="text-sm text-muted-foreground">
            First select the emotion that closely describes how you feel then name it to tame it.
          </p>
        </header>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1. The state
          </h3>
          <StateCardGrid selectedId={stateId} onSelect={setStateId} />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            2. Voice baseline
          </h3>
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <VoiceCapture
              onCaptured={setProsody}
              onSkip={() => setProsody(SKIPPED_PROSODY)}
            />
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={!canSave || saving}
          size="lg"
          className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95 h-12"
        >
          {saving ? "Saving…" : "Save baseline"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          Audio is processed locally and discarded. Only pitch, energy, and
          quality flags are stored.
        </p>
      </motion.div>
    </TacticalShell>
  );
};

const IdentifyPage = () => (
  <StepGuard step="identify">
    <IdentifyInner />
  </StepGuard>
);

export default IdentifyPage;
