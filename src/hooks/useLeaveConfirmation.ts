import { useEffect, useState, useCallback } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Hook that shows a confirmation dialog when the user tries to navigate away
 * or close the tab while `shouldBlock` is true.
 *
 * Returns an object with:
 *   - `showConfirm` (boolean) — true when the blocker is active and user has
 *     initiated a navigation. Render your dialog/modals based on this.
 *   - `confirmLeave` (function) — call to allow navigation.
 *   - `cancelLeave` (function) — call to stay on the page.
 */
export function useLeaveConfirmation(shouldBlock: boolean) {
  const [showConfirm, setShowConfirm] = useState(false);

  // React Router navigation blocker
  const blocker = useBlocker(
    useCallback(() => shouldBlock, [shouldBlock])
  );

  // When blocker.state changes to "blocked", show our dialog
  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowConfirm(true);
    } else {
      setShowConfirm(false);
    }
  }, [blocker.state, blocker]);

  // Browser tab close / page refresh
  useEffect(() => {
    if (!shouldBlock) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldBlock]);

  const confirmLeave = useCallback(() => {
    setShowConfirm(false);
    if (blocker.state === "blocked") {
      blocker.proceed?.();
    }
  }, [blocker]);

  const cancelLeave = useCallback(() => {
    setShowConfirm(false);
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
  }, [blocker]);

  return { showConfirm, confirmLeave, cancelLeave };
}
