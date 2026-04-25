import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StepProgress } from "@/components/session/StepProgress";
import { StepGuard } from "@/components/layout/StepGuard";
import { BodyMap } from "@/components/session/BodyMap";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { scanService } from "@/services/session/scanService";
import { BODY_REGIONS } from "@/constants/bodyRegions";
import { toast } from "sonner";

const ScanInner = () => {
  const navigate = useNavigate();
  const { activeSessionId, advanceStep } = useSessionStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const startedAtRef = useRef<number>(performance.now());

  useEffect(() => {
    startedAtRef.current = performance.now();
    useSessionStore.setState({ currentStep: "scan" });
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleNext = async () => {
    if (!activeSessionId) return;
    if (selected.length === 0) {
      toast.error("Select at least one region");
      return;
    }
    setSaving(true);
    try {
      await scanService.save(
        activeSessionId,
        selected,
        Math.round(performance.now() - startedAtRef.current)
      );
      advanceStep("scan");
      navigate("/session/identify");
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
        className="space-y-5"
      >
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Scan</h2>
          <p className="text-sm text-muted-foreground">
            Where do you notice sensation in your body? Tap any regions that feel
            activated, tense, or alive.
          </p>
        </header>

        <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
          <BodyMap selected={selected} onToggle={toggle} />
        </div>

        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {selected.length === 0 ? (
            <p className="text-xs text-muted-foreground">No regions selected yet.</p>
          ) : (
            selected.map((id) => {
              const region = BODY_REGIONS.find((r) => r.id === id);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/20"
                >
                  {region?.label ?? id}
                  <span className="text-brand/60">×</span>
                </button>
              );
            })
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={saving || selected.length === 0}
          size="lg"
          className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95 h-12"
        >
          {saving ? "Saving…" : "Continue to Identify"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </motion.div>
    </AppShell>
  );
};

const ScanPage = () => (
  <StepGuard step="scan">
    <ScanInner />
  </StepGuard>
);

export default ScanPage;
