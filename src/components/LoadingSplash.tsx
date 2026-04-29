import { useEffect, useState } from "react";

export function LoadingSplash() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return true;
  });

  useEffect(() => {
    if (!visible) return;

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4a271a] text-white shadow-2xl">
      <div className="relative mx-4 flex w-full max-w-3xl flex-col items-center gap-6 md:p-10">
        <div className="relative flex w-full items-end justify-center flex-col">
          <video
            autoPlay
            muted
            playsInline
            loop
            className="h-[300px] w-full object-contain bg-transparent"
          >
            <source src="/loader-bunny.webm" type="video/webm" />
            <source src="/loader-bunny.mp4" type="video/mp4" />
          </video>
          <div className="bottom-5 flex w-full justify-center">
            <img
              src="/basket-logo-transparent.png"
              alt="Basket logo"
              className="h-[150px] w-auto object-contain"
            />
          </div>
        </div>

        <div className="space-y-10 text-center text-white/90">
          <div className="text-[40px] uppercase tracking-[0.36em] text-white/60">
            S.I.G.H.T LAB
          </div>
          <div className="text-xl font-semibold tracking-[0.18em] text-white">
            Tactical Healing
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-white/70" aria-label="Loading">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse delay-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse delay-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
