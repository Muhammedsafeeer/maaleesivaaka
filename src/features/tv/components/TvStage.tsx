"use client";

import { useEffect, useState } from "react";

const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

/**
 * Most TVs crop a margin off every edge of an HDMI signal by default (overscan —
 * "Just Scan"/"Screen Fit" is the menu setting that turns it off, but plenty of
 * hall/lobby TVs never get that flipped). Scaling to the *full* reported viewport
 * means that cropped strip eats real content, so the stage targets a safe area a bit
 * smaller than the viewport instead — worst case a 53" TV crops 5%, this leaves the
 * spotlight-deep background bleeding off the true edge and every slide fully intact.
 */
const SAFE_AREA_RATIO = 0.94;

function computeScale(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(
    (window.innerWidth * SAFE_AREA_RATIO) / STAGE_WIDTH,
    (window.innerHeight * SAFE_AREA_RATIO) / STAGE_HEIGHT,
  );
}

/**
 * Every /tv slide is authored against a fixed 1920x1080 reference canvas, then this
 * wrapper uniformly scales that canvas to whatever the actual screen reports —
 * everything from a 1080p 55" hall display to a 4K one ends up the same proportions,
 * filling the screen, instead of rendering at literal CSS-pixel size (tiny on a big
 * panel) or overflowing (cut off on a small one). Scale is recomputed on resize/
 * orientation change so it also survives a TV browser's zoom/DPI quirks.
 */
export function TvStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      setScale(computeScale());
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-(--stage-spotlight-deep)">
      <div
        className="absolute top-1/2 left-1/2 h-[1080px] w-[1920px]"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
