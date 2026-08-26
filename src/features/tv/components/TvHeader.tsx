"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { CrescentStar } from "@/features/leaderboard/components/MotifIcons";
import { useFullscreen } from "@/hooks/useFullscreen";

/**
 * Persistent branding + live clock, rendered outside the per-slide cross-fade so it
 * never flickers between rotations. `now` starts as a real Date (not null) so the
 * effect only ever sets up the interval subscription, never calls setState directly in
 * its own body. `suppressHydrationWarning` on the clock text is the deliberate, narrow
 * escape hatch for the one element that's genuinely expected to differ between server
 * and client renders (network latency between the two), not a blanket suppression.
 *
 * Also owns the TV's fullscreen mode. Real TV/kiosk browsers vary in whether they start
 * already fullscreen (no address bar) or as a normal windowed tab — the latter loses
 * vertical space to browser chrome, which then shrinks the CSS `100vh` used by the
 * stage fit-scale (globals.css). `requestFullscreen()` is attempted once on mount for
 * browsers that allow it without a prior gesture; where the spec requires a gesture
 * it's silently rejected (see useFullscreen), so a small always-present toggle covers
 * that case for whoever sets the display up — one tap, then it's untouched for the
 * rest of the unattended run.
 */
export function TvHeader() {
  const [now, setNow] = useState(() => new Date());
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (document.fullscreenElement || !document.fullscreenEnabled) return;
    document.documentElement.requestFullscreen().catch(() => {
      // Most browsers require a user gesture — the toggle button below covers those.
    });
  }, []);

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-(--tv-40) py-(--tv-24)">
      <div className="flex items-center gap-(--tv-10)">
        <CrescentStar className="lantern-glow size-(--tv-24) text-(--stage-spotlight-gold)" />
        <p className="font-[family-name:var(--font-audience-display)] text-[length:var(--tv-20)] font-bold text-(--stage-spotlight-ink)">
          Maalee Sivaaka
        </p>
      </div>
      <div className="flex items-center gap-(--tv-16)">
        <p
          className="font-mono text-[length:var(--tv-18)] font-semibold tabular-nums text-(--stage-spotlight-ink-dim)"
          suppressHydrationWarning
        >
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="rounded-full p-(--tv-8) text-(--stage-spotlight-gold) opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          {isFullscreen ? (
            <Minimize className="size-(--tv-16)" />
          ) : (
            <Maximize className="size-(--tv-16)" />
          )}
        </button>
      </div>
    </div>
  );
}
