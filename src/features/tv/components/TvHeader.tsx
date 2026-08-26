"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { CrescentStar } from "@/features/leaderboard/components/MotifIcons";
import { useFullscreen } from "@/hooks/useFullscreen";

/**
 * Persistent branding + clock. Uses plain `.tv-header*` classes from inlined
 * critical CSS so the hall TV still lays out when the Tailwind bundle is ignored.
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
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  return (
    <div className="tv-header">
      <div className="tv-header-brand">
        <CrescentStar
          className="tv-header-icon"
          style={{ width: "var(--tv-28)", height: "var(--tv-28)", color: "#e8c44a" }}
        />
        <p className="tv-header-title">Maalee Sivaaka</p>
      </div>
      <div className="tv-header-meta">
        <p className="tv-header-clock" suppressHydrationWarning>
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="tv-header-fs"
        >
          {isFullscreen ? (
            <Minimize className="tv-header-icon" style={{ width: 24, height: 24 }} />
          ) : (
            <Maximize className="tv-header-icon" style={{ width: 24, height: 24 }} />
          )}
        </button>
      </div>
    </div>
  );
}
