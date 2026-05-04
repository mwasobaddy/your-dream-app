import { motion, AnimatePresence } from "framer-motion";
import type { StepName } from "@/types/session";

const STEP_DATA: Record<StepName, { title: string; desc: string }> = {
  scan: {
    title: "Scan",
    desc: "Notice what your body is holding. Take a moment to feel where tension lives.",
  },
  identify: {
    title: "Identify",
    desc: "Name the state. Use your voice to capture the baseline.",
  },
  ground_heal: {
    title: "Ground & Heal",
    desc: "Press and hold to release.",
  },
  track: {
    title: "Track",
    desc: "See the shift. Voice delta and somatic reflection.",
  },
};

interface SessionOverlayProps {
  step: StepName | null;
  open: boolean;
  onBegin: () => void;
  onClose: () => void;
}

export function SessionOverlay({ step, open, onBegin, onClose }: SessionOverlayProps) {
  const data = step ? STEP_DATA[step] : null;

  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          className="compass-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="compass-overlay-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="compass-overlay-title">{data.title}</h2>
            <p className="compass-overlay-desc">{data.desc}</p>
            <button className="compass-overlay-btn" onClick={onBegin}>
              Begin
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
