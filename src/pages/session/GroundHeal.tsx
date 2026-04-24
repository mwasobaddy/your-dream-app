import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StepProgress } from "@/components/session/StepProgress";
import { StepGuard } from "@/components/layout/StepGuard";
import { BoxBreathPacer, type PacerResult } from "@/components/session/BoxBreathPacer";
import { PressHold, type PressHoldResult } from "@/components/session/PressHold";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { groundHealService } from "@/services/session/groundHealService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GroundHealInner = () => {
  const navigate = useNavigate();
  const { activeSessionId, advanceStep } = useSessionStore();

  const [pacer, setPacer] = useState<PacerResult | null>(null);
  const [press, setPress] = useState<PressHoldResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    useSessionStore.setState({ currentStep: "ground_heal" });
  }, []);

  const canSave = !!pacer && !!press;

  const handleSave = async () => {
    if (!activeSessionId || !pacer || !press) return;
    setSaving(true);
    try {
      await groundHealService.save(activeSessionId, {
        pacer_phase_timestamps: pacer.pacer_phase_timestamps,
        ground_adherence_ratio: pacer.ground_adherence_ratio,
        heal_press_start_ms: press.press_start_ms,
        heal_hold_duration_ms: press.hold_duration_ms,
        heal_release_velocity_ms: press.release_velocity_ms,
      });
      advanceStep("ground_heal");
      toast.success("Ground & Heal saved", {
        description: "Track step coming next.",
      });
      navigate("/");
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <StepProgress />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Ground &amp; Heal</h2>
          <p className="text-sm text-muted-foreground">
            Slow the system with paced breath, then anchor with steady touch.
          </p>
        </header>

        <section className="space-y-3">
          <SectionHeader
            index={1}
            title="Box-breath pacer"
            done={!!pacer}
            meta={
              pacer
                ? `Adherence ${Math.round(pacer.ground_adherence_ratio * 100)}%`
                : undefined
            }
          />
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <BoxBreathPacer cycles={3} onComplete={setPacer} />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            index={2}
            title="Press & hold"
            done={!!press}
            meta={
              press ? `Held ${(press.hold_duration_ms / 1000).toFixed(1)}s` : undefined
            }
          />
          <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm">
            <PressHold onComplete={setPress} />
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={!canSave || saving}
          size="lg"
          className="w-full bg-gradient-teal text-teal-foreground hover:opacity-95 h-12"
        >
          {saving ? "Saving…" : "Save & continue"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          All metrics stay on this device. No audio is recorded during this step.
        </p>
      </motion.div>
    </AppShell>
  );
};

function SectionHeader({
  index,
  title,
  done,
  meta,
}: {
  index: number;
  title: string;
  done?: boolean;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {index}. {title}
      </h3>
      {done && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium",
            "text-success"
          )}
        >
          <Check className="h-3 w-3" />
          {meta ?? "Done"}
        </span>
      )}
    </div>
  );
}

const GroundHealPage = () => (
  <StepGuard step="ground_heal">
    <GroundHealInner />
  </StepGuard>
);

export default GroundHealPage;
