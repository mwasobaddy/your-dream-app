/**
 * PWA service worker registration with iframe + Sight Lab-preview guard.
 *
 * Service workers in iframes (Sight Lab's editor preview) cause stale content
 * and routing issues. We unregister any pre-existing SW in those contexts and
 * only register in real production deployments.
 */
import { registerSW as registerVitePWA } from "virtual:pwa-register";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("sight-lab.com"));

export function registerSW() {
  if (typeof window === "undefined") return;

  if (isPreviewHost || isInIframe) {
    // Defensive: unregister any leftover service workers from earlier sessions.
    navigator.serviceWorker?.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  registerVitePWA({
    immediate: true,
    onNeedRefresh() {
      // Auto-update silently — research session continuity matters more than a banner.
    },
    onOfflineReady() {
      // No-op: PWA is offline-first by design here.
    },
  });
}
