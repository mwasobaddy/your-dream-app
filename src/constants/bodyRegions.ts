// Placeholder taxonomy — swap with the client-supplied region list when delivered.
// Coordinates are normalised to the 200x500 SVG body silhouette in BodyMap.tsx.

export interface BodyRegion {
  id: string;
  label: string;
  /** Centre point as percentages of the SVG viewBox. */
  cx: number;
  cy: number;
  /** Hit-area radius in viewBox units. */
  r: number;
}

export const BODY_REGIONS: readonly BodyRegion[] = [
  { id: "head", label: "Head", cx: 100, cy: 50, r: 32 },
  { id: "throat", label: "Throat", cx: 100, cy: 95, r: 14 },
  { id: "shoulders", label: "Shoulders", cx: 100, cy: 120, r: 22 },
  { id: "chest", label: "Chest", cx: 100, cy: 165, r: 28 },
  { id: "heart", label: "Heart", cx: 85, cy: 165, r: 14 },
  { id: "upper_back", label: "Upper back", cx: 100, cy: 200, r: 22 },
  { id: "abdomen", label: "Abdomen", cx: 100, cy: 230, r: 24 },
  { id: "lower_back", label: "Lower back", cx: 100, cy: 260, r: 22 },
  { id: "hips", label: "Hips / pelvis", cx: 100, cy: 290, r: 26 },
  { id: "arms", label: "Arms / hands", cx: 50, cy: 230, r: 18 },
  { id: "legs", label: "Legs", cx: 100, cy: 380, r: 28 },
  { id: "feet", label: "Feet", cx: 100, cy: 470, r: 18 },
] as const;

export type BodyRegionId = (typeof BODY_REGIONS)[number]["id"];
