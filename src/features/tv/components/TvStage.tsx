"use client";

/**
 * Full-bleed TV shell. Size tokens come from inlined critical CSS (vmin) on
 * `.tv-shell` — no 1920×1080 transform canvas (that path scaled to 2× on 4K
 * reports and cropped the stage on the hall TV).
 */
export function TvStage({ children }: { children: React.ReactNode }) {
  return (
    <div id="tv-viewport" className="tv-viewport" style={{ background: "#1a1028" }}>
      <div id="tv-stage" className="tv-stage" style={{ background: "#1a1028" }}>
        <div id="tv-stage-inner">{children}</div>
      </div>
    </div>
  );
}
