// Placeholder taxonomy — swap with the client-supplied state list when delivered.

export interface EmotionalState {
  id: string;
  label: string;
  /** Short description shown on the card. */
  description: string;
  /** Tailwind hue accent — uses CSS variables defined in index.css. */
  accent:
    | "calm"
    | "anxious"
    | "sad"
    | "angry"
    | "joyful"
    | "tender"
    | "alert"
    | "numb";
}

export const EMOTIONAL_STATES: readonly EmotionalState[] = [
  { id: "calm", label: "Calm", description: "Settled, at ease", accent: "calm" },
  { id: "anxious", label: "Anxious", description: "Activated, on edge", accent: "anxious" },
  { id: "sad", label: "Sad", description: "Heavy, downcast", accent: "sad" },
  { id: "angry", label: "Angry", description: "Hot, charged", accent: "angry" },
  { id: "joyful", label: "Joyful", description: "Light, expansive", accent: "joyful" },
  { id: "tender", label: "Tender", description: "Open, sensitive", accent: "tender" },
  { id: "alert", label: "Alert", description: "Wide-awake, focused", accent: "alert" },
  { id: "numb", label: "Numb", description: "Disconnected, flat", accent: "numb" },
] as const;

export type EmotionalStateId = (typeof EMOTIONAL_STATES)[number]["id"];
