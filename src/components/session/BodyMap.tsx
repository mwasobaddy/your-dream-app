import { motion } from "framer-motion";
import { BODY_REGIONS, type BodyRegion } from "@/constants/bodyRegions";
import { cn } from "@/lib/utils";

interface BodyMapProps {
  selected: string[];
  onToggle: (regionId: string) => void;
}

export function BodyMap({ selected, onToggle }: BodyMapProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <svg
        viewBox="0 0 200 520"
        className="w-full h-auto"
        role="img"
        aria-label="Body map"
      >
        {/* Stylised silhouette */}
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--brand-soft))" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </linearGradient>
        </defs>

        {/* Head */}
        <ellipse cx="100" cy="50" rx="32" ry="36" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Neck */}
        <rect x="90" y="82" width="20" height="14" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Torso */}
        <path
          d="M 60 100 Q 60 95 70 95 L 130 95 Q 140 95 140 100 L 145 200 Q 145 240 138 280 L 132 320 L 68 320 L 62 280 Q 55 240 55 200 Z"
          fill="url(#bodyGrad)"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        {/* Arms */}
        <path d="M 60 105 L 35 200 L 30 270 L 42 272 L 50 200 L 70 110 Z" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <path d="M 140 105 L 165 200 L 170 270 L 158 272 L 150 200 L 130 110 Z" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Legs */}
        <path d="M 68 320 L 62 460 L 76 460 L 92 330 Z" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <path d="M 132 320 L 138 460 L 124 460 L 108 330 Z" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Feet */}
        <ellipse cx="69" cy="475" rx="14" ry="8" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <ellipse cx="131" cy="475" rx="14" ry="8" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Region tap targets */}
        {BODY_REGIONS.map((region: BodyRegion) => {
          const isSelected = selected.includes(region.id);
          return (
            <motion.circle
              key={region.id}
              cx={region.cx}
              cy={region.cy}
              r={region.r}
              className={cn(
                "cursor-pointer transition-colors",
                isSelected
                  ? "fill-brand/40 stroke-brand"
                  : "fill-transparent stroke-transparent hover:fill-brand/15"
              )}
              strokeWidth="2"
              onClick={() => onToggle(region.id)}
              whileTap={{ scale: 0.9 }}
              animate={isSelected ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              role="button"
              aria-label={`${region.label} ${isSelected ? "selected" : "not selected"}`}
              aria-pressed={isSelected}
            />
          );
        })}
      </svg>
    </div>
  );
}
