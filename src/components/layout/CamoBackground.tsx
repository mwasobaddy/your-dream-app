import { useEffect, useRef } from "react";

/**
 * Full-viewport fixed canvas that draws a seeded camo/blob pattern.
 * Matches sample.html — dark brown base with layered organic blobs.
 */
export function CamoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Seeded PRNG
    function seededRandom(seed: number) {
      let s = seed;
      return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
      };
    }

    function drawBlob(
      cx: number,
      cy: number,
      w: number,
      h: number,
      color: string,
      seedVal: number,
    ) {
      const numPoints = 24;
      ctx!.fillStyle = color;
      ctx!.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (2 * Math.PI * i) / numPoints;
        const rVar =
          1.0 +
          0.12 * Math.sin(2 * angle + seedVal * 0.5) +
          0.08 * Math.sin(4 * angle + seedVal * 1.1) +
          0.05 * Math.sin(6 * angle + seedVal * 1.7) +
          0.03 * Math.sin(8 * angle + seedVal * 2.3);
        const x = cx + (w / 2) * rVar * Math.cos(angle);
        const y = cy + (h / 2) * rVar * Math.sin(angle);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.fill();
    }

    function drawCamo() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const rand = seededRandom(42);

      // Base fill
      ctx!.fillStyle = "#C45C3E";
      ctx!.fillRect(0, 0, width, height);

      // Layer 1 — large blobs
      for (let i = 0; i < 5; i++) {
        drawBlob(
          rand() * (width + 400) - 200,
          rand() * (height + 400) - 200,
          400 + rand() * 300,
          300 + rand() * 200,
          ["#7A2E0F", "#8B3A1A"][Math.floor(rand() * 2)],
          i * 1000,
        );
      }

      // Layer 2 — medium blobs
      for (let i = 0; i < 8; i++) {
        drawBlob(
          rand() * (width + 200) - 100,
          rand() * (height + 200) - 100,
          250 + rand() * 200,
          180 + rand() * 170,
          ["#A04020", "#B85A30", "#C86030"][Math.floor(rand() * 3)],
          i * 1000 + 500,
        );
      }

      // Layer 3 — smaller blobs
      for (let i = 0; i < 10; i++) {
        drawBlob(
          rand() * (width + 100) - 50,
          rand() * (height + 100) - 50,
          120 + rand() * 160,
          90 + rand() * 110,
          ["#D47040", "#E08050", "#F0A070"][Math.floor(rand() * 3)],
          i * 1000 + 250,
        );
      }

      // Layer 4 — tiny blobs
      for (let i = 0; i < 12; i++) {
        drawBlob(
          rand() * width,
          rand() * height,
          50 + rand() * 90,
          40 + rand() * 60,
          ["#F0A070", "#F8C8A0"][Math.floor(rand() * 2)],
          i * 1000 + 750,
        );
      }
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.scale(dpr, dpr);
      drawCamo();
    }

    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}