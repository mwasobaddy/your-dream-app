import { useRef, useEffect } from "react";
import { BodyChart, ViewSide } from "body-muscles";
import { BODY_REGIONS, buildMuscleState } from "@/constants/bodyRegions";

interface BodyMapProps {
  selected: string[];
  onToggle: (regionId: string) => void;
}

export function BodyMap({ selected, onToggle }: BodyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  // Keep a ref to selected so the click handler always sees the latest value
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Build a reverse lookup: muscleId -> regionId
  const muscleToRegionRef = useRef<Map<string, string>>(new Map());

  // Initialise the chart once
  useEffect(() => {
    if (!containerRef.current) return;

    // Build reverse lookup
    const reverseMap = new Map<string, string>();
    for (const region of BODY_REGIONS) {
      for (const mid of region.muscleIds) {
        reverseMap.set(mid, region.id);
      }
    }
    muscleToRegionRef.current = reverseMap;

    const bodyState = buildMuscleState(selectedRef.current);

    const chart = new BodyChart(containerRef.current, {
      view: ViewSide.FRONT,
      bodyState,
      onMuscleClick: (muscleId: string) => {
        const regionId = muscleToRegionRef.current.get(muscleId);
        if (regionId) {
          onToggle(regionId);
        }
      },
      className: "mx-auto",
      ariaLabel: "Human body map — tap a region to select or deselect",
      showViewLabel: false,
      enableTransitions: true,
    });

    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []); // mount once

  // Sync body state when selected changes
  useEffect(() => {
    chartRef.current?.update({
      bodyState: buildMuscleState(selected),
    });
  }, [selected]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div ref={containerRef} className="[&_svg]:w-full [&_svg]:h-auto" />
    </div>
  );
}
