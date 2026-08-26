"use client";

import { useCallback, useEffect, useState } from "react";

type DocWithFs = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
};

type ElWithFs = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as DocWithFs;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

function requestFs(el: HTMLElement) {
  const target = el as ElWithFs;
  if (target.requestFullscreen) return target.requestFullscreen();
  if (target.webkitRequestFullscreen) return Promise.resolve(target.webkitRequestFullscreen());
  if (target.msRequestFullscreen) return Promise.resolve(target.msRequestFullscreen());
  return Promise.reject(new Error("Fullscreen API unavailable"));
}

function exitFs() {
  const doc = document as DocWithFs;
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return Promise.resolve(doc.webkitExitFullscreen());
  if (doc.msExitFullscreen) return Promise.resolve(doc.msExitFullscreen());
  return Promise.resolve();
}

/**
 * Projector/TV mode for the audience view.
 * Vendor-prefixed Fullscreen API for older embedded browsers; many hall TVs
 * still refuse fullscreen — layout must fit with browser chrome either way.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(getFullscreenElement() !== null);
    }

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (getFullscreenElement()) {
      void exitFs().catch(() => {});
    } else {
      void requestFs(document.documentElement).catch(() => {});
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
