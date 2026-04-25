// Mapping from our high-level body regions to the body-muscles library muscle IDs.
// The library provides 89 detailed anatomical regions; we group them into 12
// sensation-reporting zones that users tap on.

export interface BodyRegion {
  id: string;
  label: string;
  /** IDs of muscle regions in the body-muscles library that belong to this region. */
  muscleIds: string[];
}

export const BODY_REGIONS: readonly BodyRegion[] = [
  {
    id: "head",
    label: "Head",
    muscleIds: ["0", "1", "40"],
  },
  {
    id: "neck",
    label: "Neck",
    muscleIds: ["2", "3", "41"],
  },
  {
    id: "shoulders",
    label: "Shoulders",
    muscleIds: ["4", "5", "6", "7", "42", "43", "44", "45", "46", "47"],
  },
  {
    id: "arms",
    label: "Arms / hands",
    muscleIds: [
      "8", "9", "10", "11",
      "36", "37", "38", "39",
      "48", "49", "50", "51", "52", "53", "54", "55",
      "56", "57", "58", "59", "60", "61", "62", "63", "64", "65",
    ],
  },
  {
    id: "chest",
    label: "Chest",
    muscleIds: ["12", "13", "14", "15"],
  },
  {
    id: "abdomen",
    label: "Abdomen",
    muscleIds: ["16", "17", "18", "19", "20", "21", "22", "23"],
  },
  {
    id: "upper_back",
    label: "Upper back",
    muscleIds: ["48", "49", "50", "51", "52", "53", "54", "55"],
  },
  {
    id: "lower_back",
    label: "Lower back",
    muscleIds: ["66", "67", "68", "69", "70"],
  },
  {
    id: "hips",
    label: "Hips / pelvis",
    muscleIds: ["24", "25", "71", "72", "73", "74"],
  },
  {
    id: "legs",
    label: "Legs",
    muscleIds: [
      "26", "27", "29", "30", "31", "32", "34", "35",
      "75", "76", "77", "78", "79", "80", "81", "82",
      "84", "85", "87", "88",
    ],
  },
  {
    id: "feet",
    label: "Feet",
    muscleIds: ["28", "33", "83", "86"],
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
