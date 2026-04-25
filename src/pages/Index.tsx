import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Activity, Wind, LineChart, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { startNewSession } from "@/services/session/sessionOrchestrator";
import { useSessionStore } from "@/stores/sessionStore";
import { toast } from "sonner";

const STEPS = [
  { icon: Activity, label: "Scan", desc: "Body sensations" },
  { icon: Mic, label: "Identify", desc: "Name the state · voice baseline" },
  { icon: Wind, label: "Ground & Heal", desc: "Box breath + somatic press" },
  { icon: LineChart, label: "Track", desc: "Voice delta + reflection" },
];

const Index = () => {
  const navigate = useNavigate();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const handleBegin = async () => {
    try {
      const id = await startNewSession();
      setActiveSession(id);
      navigate("/session/scan");
    } catch (err) {
      toast.error("Could not start session", {
        description: err instanceof Error ? err.message : "Storage error",
      });
    }
  };

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        <header className="text-center space-y-3 pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Somatic Emotional<br />
            Regulation Protocol
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            A four-step somatic check-in. Captures body, voice, breath, and shift —
            entirely on this device. No PII is collected. Your data is yours.
          </p>
        </header>

        <div className="grid gap-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">
                  <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleBegin}
            size="lg"
            className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95 shadow-elevated h-12"
          >
            Begin session
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/history">History</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/settings">Settings</Link>
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-4 border-t border-border/40">
          Everything runs entirely on this device. No PII is ever collected,
          transmitted, or stored externally. Your data is yours —{" "}
          <Link to="/settings" className="underline underline-offset-2 hover:text-foreground transition-colors">
            visit settings
          </Link>{" "}
          to manage or export it.
        </p>
      </motion.section>
    </AppShell>
  );
};

export default Index;
