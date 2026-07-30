"use client";

import { useCallback, useEffect, useState } from "react";

/** Projector/TV mode for the audience view (src/hooks/README.md's Phase 16 plan).
 * Wraps the browser Fullscreen API — `document.fullscreenElement` is the source of
 * truth (not local state alone), since fullscreen can also be exited via Esc or
 * browser chrome outside this hook's control. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement !== null);
    }

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen can be denied (e.g. iframe without allow="fullscreen", or a
        // browser that doesn't support it) — fail silently, the page still works.
      });
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
