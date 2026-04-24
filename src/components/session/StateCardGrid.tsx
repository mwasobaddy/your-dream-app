import { motion } from "framer-motion";
import { EMOTIONAL_STATES } from "@/constants/emotionalStates";
import { cn } from "@/lib/utils";

interface StateCardGridProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ACCENT_CLASS: Record<string, string> = {
  calm: "border-state-calm/40 hover:border-state-calm",
  anxious: "border-state-anxious/40 hover:border-state-anxious",
  sad: "border-state-sad/40 hover:border-state-sad",
  angry: "border-state-angry/40 hover:border-state-angry",
  joyful: "border-state-joyful/40 hover:border-state-joyful",
  tender: "border-state-tender/40 hover:border-state-tender",
  alert: "border-state-alert/40 hover:border-state-alert",
  numb: "border-state-numb/40 hover:border-state-numb",
};

const SELECTED_CLASS: Record<string, string> = {
  calm: "border-state-calm bg-state-calm/10",
  anxious: "border-state-anxious bg-state-anxious/10",
  sad: "border-state-sad bg-state-sad/10",
  angry: "border-state-angry bg-state-angry/10",
  joyful: "border-state-joyful bg-state-joyful/10",
  tender: "border-state-tender bg-state-tender/10",
  alert: "border-state-alert bg-state-alert/10",
  numb: "border-state-numb bg-state-numb/10",
};

export function StateCardGrid({ selectedId, onSelect }: StateCardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {EMOTIONAL_STATES.map((state) => {
        const isSelected = selectedId === state.id;
        return (
          <motion.button
            key={state.id}
            onClick={() => onSelect(state.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "rounded-xl border-2 bg-card p-3 text-left transition-all shadow-sm",
              isSelected
                ? SELECTED_CLASS[state.accent]
                : ACCENT_CLASS[state.accent]
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn("h-2 w-8 rounded-full mb-2")}
              style={{ background: `hsl(var(--state-${state.accent}))` }}
            />
            <div className="text-sm font-semibold">{state.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {state.description}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
