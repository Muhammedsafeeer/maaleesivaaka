"use client";

import { useEffect, useState } from "react";
import { CrescentStar } from "@/features/leaderboard/components/MotifIcons";

/**
 * Persistent branding + live clock, rendered outside the per-slide cross-fade so it
 * never flickers between rotations. `now` starts as a real Date (not null) so the
 * effect only ever sets up the interval subscription, never calls setState directly in
 * its own body. `suppressHydrationWarning` on the clock text is the deliberate, narrow
 * escape hatch for the one element that's genuinely expected to differ between server
 * and client renders (network latency between the two), not a blanket suppression.
 */
export function TvHeader() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-(--tv-40) py-(--tv-24)">
      <div className="flex items-center gap-(--tv-10)">
        <CrescentStar className="lantern-glow size-(--tv-24) text-(--stage-spotlight-gold)" />
        <p className="font-[family-name:var(--font-audience-display)] text-[length:var(--tv-20)] font-bold text-(--stage-spotlight-ink)">
          Maalee Sivaaka
        </p>
      </div>
      <p
        className="font-mono text-[length:var(--tv-18)] font-semibold tabular-nums text-(--stage-spotlight-ink-dim)"
        suppressHydrationWarning
      >
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
