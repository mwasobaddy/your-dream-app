// Mapping from our high-level body regions to the body-muscles library muscle IDs.
// The library provides 89 detailed anatomical regions (40 front + 49 back);
// we group them into 12 sensation-reporting zones that users tap on.
// Each zone includes both front and back muscles so selecting e.g. "head"
// highlights all muscles associated with the head on both sides.

export interface BodyRegion {
  id: string;
  label: string;
  /** Named IDs of muscle regions in the body-muscles library that belong to this region. */
  muscleIds: string[];
}

export const BODY_REGIONS: readonly BodyRegion[] = [
  {
    id: "head",
    label: "Head",
    // Everything about the head: face, front head, back of head (including hair)
    muscleIds: [
      "head",       // Head (FRONT)
      "face",       // Face (FRONT)
      "head-back",  // Head (Posterior) (BACK) — includes back of head / hair
    ],
  },
  {
    id: "neck",
    label: "Neck",
    // Side neck muscles front + back (also nape/uppermost back of neck)
    muscleIds: [
      "neck-right",     // Right Neck (FRONT)
      "neck-left",       // Left Neck (FRONT)
      "nape",            // Nape (BACK) — back of upper neck
      "traps-upper-left",   // Left Trapezius (Upper) (BACK)
      "traps-upper-right",  // Right Trapezius (Upper) (BACK)
    ],
  },
  {
    id: "shoulders",
    label: "Shoulders",
    // All shoulder front + side + rear deltoid + mid/lower traps
    muscleIds: [
      "shoulder-front-left",   // Left Shoulder (Front) (FRONT)
      "shoulder-side-left",    // Left Shoulder (Side) (FRONT)
      "shoulder-front-right",   // Right Shoulder (Front) (FRONT)
      "shoulder-side-right",   // Right Shoulder (Side) (FRONT)
      "deltoid-rear-left",     // Left Rear Deltoid (BACK)
      "deltoid-rear-right",    // Right Rear Deltoid (BACK)
      "traps-mid-left",        // Left Trapezius (Mid) (BACK)
      "traps-lower-left",      // Left Trapezius (Lower) (BACK)
      "traps-mid-right",       // Right Trapezius (Mid) (BACK)
      "traps-lower-right",     // Right Trapezius (Lower) (BACK)
    ],
  },
  {
    id: "arms",
    label: "Arms / hands",
    // Biceps, triceps, forearms, elbows, hands — all left + right, front + back
    muscleIds: [
      // Front — left
      "biceps-left",     // Left Biceps (FRONT)
      "forearm-left",    // Left Forearm (FRONT)
      "elbow-left",      // Left Elbow (FRONT)
      "hand-left",       // Left Hand (FRONT)
      // Front — right
      "biceps-right",    // Right Biceps (FRONT)
      "forearm-right",   // Right Forearm (FRONT)
      "elbow-right",     // Right Elbow (FRONT)
      "hand-right",      // Right Hand (FRONT)
      // Back — left
      "triceps-long-left",       // Left Triceps (Long Head) (BACK)
      "triceps-lateral-left",    // Left Triceps (Lateral Head) (BACK)
      "hand-back-left",          // Left Hand (Back) (BACK)
      "forearm-flexors-left",    // Forearm Flexors Left (BACK)
      "forearm-extensors-left",  // Forearm Extensors Left (BACK)
      // Back — right
      "triceps-long-right",      // Right Triceps (Long Head) (BACK)
      "triceps-lateral-right",   // Right Triceps (Lateral Head) (BACK)
      "hand-back-right",         // Right Hand (Back) (BACK)
      "forearm-flexors-right",   // Forearm Flexors Right (BACK)
      "forearm-extensors-right", // Forearm Extensors Right (BACK)
    ],
  },
  {
    id: "chest",
    label: "Chest",
    // Pectorals upper + lower, left + right
    muscleIds: [
      "chest-upper-left",   // Left Upper Chest (Clavicular) (FRONT)
      "chest-lower-left",   // Left Lower Chest (Sternal) (FRONT)
      "chest-upper-right",  // Right Upper Chest (Clavicular) (FRONT)
      "chest-lower-right",  // Right Lower Chest (Sternal) (FRONT)
      "serratus-anterior-left",  // Left Serratus Anterior (FRONT)
      "serratus-anterior-right", // Right Serratus Anterior (FRONT)
    ],
  },
  {
    id: "abdomen",
    label: "Abdomen",
    // Abs, obliques — front only
    muscleIds: [
      "abs-upper-left",    // Left Abs (Upper) (FRONT)
      "abs-upper-right",   // Right Abs (Upper) (FRONT)
      "abs-lower-left",    // Left Lower Abs (FRONT)
      "abs-lower-right",   // Right Lower Abs (FRONT)
      "obliques-left",     // Left External Oblique (FRONT)
      "obliques-right",    // Right External Oblique (FRONT)
    ],
  },
  {
    id: "upper_back",
    label: "Upper back",
    // Lats, lower traps, spine
    muscleIds: [
      "lats-upper-left",    // Left Lats (Upper) (BACK)
      "lats-mid-left",      // Left Lats (Mid) (BACK)
      "lats-lower-left",    // Left Lats (Lower) (BACK)
      "lats-upper-right",   // Right Lats (Upper) (BACK)
      "lats-mid-right",     // Right Lats (Mid) (BACK)
      "lats-lower-right",   // Right Lats (Lower) (BACK)
      "spine",              // Spine (BACK)
    ],
  },
  {
    id: "lower_back",
    label: "Lower back",
    // Erector spinae, quadratus lumborum
    muscleIds: [
      "lower-back-erectors-left",   // Erector Spinae Left (BACK)
      "lower-back-ql-left",         // Quadratus Lumborum Left (BACK)
      "lower-back-erectors-right",  // Erector Spinae Right (BACK)
      "lower-back-ql-right",        // Quadratus Lumborum Right (BACK)
    ],
  },
  {
    id: "hips",
    label: "Hips / pelvis",
    // Glutes, hip flexors/groin
    muscleIds: [
      "gluteus-medius-left",    // Gluteus Medius Left (BACK)
      "gluteus-maximus-left",   // Gluteus Maximus Left (BACK)
      "gluteus-medius-right",   // Gluteus Medius Right (BACK)
      "gluteus-maximus-right",  // Gluteus Maximus Right (BACK)
      "hip-flexor-left",        // Left Groin / Hip Flexors (FRONT)
      "hip-flexor-right",       // Right Groin / Hip Flexors (FRONT)
    ],
  },
  {
    id: "legs",
    label: "Legs",
    // Quads, hamstrings, adductors, tibialis, calves, knees — front + back, left + right
    muscleIds: [
      // Front — left
      "quads-left",            // Left Quadriceps (FRONT)
      "adductors-left",        // Left Adductors (FRONT)
      "tibialis-anterior-left",// Left Tibialis Anterior (FRONT)
      "knee-left",             // Left Knee (FRONT)
      // Front — right
      "quads-right",           // Right Quadriceps (FRONT)
      "adductors-right",       // Right Adductors (FRONT)
      "tibialis-anterior-right",// Right Tibialis Anterior (FRONT)
      "knee-right",            // Right Knee (FRONT)
      // Back — left
      "knee-back-left",              // Left Back Knee (BACK)
      "calves-gastroc-medial-left",  // Gastrocnemius Medial Left (BACK)
      "calves-gastroc-lateral-left", // Gastrocnemius Lateral Left (BACK)
      "calves-soleus-left",          // Soleus Left (BACK)
      "hamstrings-medial-left",      // Medial Hamstrings (Semis) Left (BACK)
      "hamstrings-lateral-left",     // Lateral Hamstrings (Biceps) Left (BACK)
      // Back — right
      "knee-back-right",             // Right Back Knee (BACK)
      "calves-gastroc-medial-right", // Gastrocnemius Medial Right (BACK)
      "calves-gastroc-lateral-right",// Gastrocnemius Lateral Right (BACK)
      "calves-soleus-right",         // Soleus Right (BACK)
      "hamstrings-medial-right",     // Medial Hamstrings (Semis) Right (BACK)
      "hamstrings-lateral-right",    // Lateral Hamstrings (Biceps) Right (BACK)
    ],
  },
  {
    id: "feet",
    label: "Feet",
    // Feet front + back, left + right
    muscleIds: [
      "foot-left",       // Left Foot (FRONT)
      "foot-right",      // Right Foot (FRONT)
      "foot-back-left",  // Left Foot (Back) (BACK)
      "foot-back-right", // Right Foot (Back) (BACK)
    ],
  },
] as const;

export type BodyRegionId = (typeof BODY_REGIONS)[number]["id"];

/** Build a bodyState map for the body-muscles library from our selected region IDs. */
export function buildMuscleState(
  selected: string[],
  allRegions: readonly BodyRegion[] = BODY_REGIONS,
): Record<string, { intensity: number; selected: boolean }> {
  const map: Record<string, { intensity: number; selected: boolean }> = {};
  for (const region of allRegions) {
    const isSelected = selected.includes(region.id);
    for (const mid of region.muscleIds) {
      map[mid] = { intensity: isSelected ? 6 : 0, selected: isSelected };
    }
  }
  return map;
}

/** Get the human-readable labels for the selected region IDs. */
export function getSelectedLabels(selected: string[]): string[] {
  return selected
    .map((id) => BODY_REGIONS.find((r) => r.id === id)?.label ?? id)
    .filter(Boolean);
}
