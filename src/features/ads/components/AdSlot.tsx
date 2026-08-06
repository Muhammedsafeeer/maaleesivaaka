"use client";

import { useEffect, useRef, useState } from "react";
import type { AdMedia, AdWithMedia } from "@/types/ad";

function AdMediaFrame({
  item,
  isCurrent,
  transitionMs,
  adName,
}: {
  item: AdMedia;
  isCurrent: boolean;
  transitionMs: number;
  adName: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isCurrent) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isCurrent]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity: isCurrent ? 1 : 0, transition: `opacity ${transitionMs}ms ease-out` }}
    >
      {item.media_type === "video" ? (
        <video
          ref={videoRef}
          src={item.media_url}
          muted
          loop
          playsInline
          aria-label={adName}
          className="size-full object-contain"
        />
      ) : (
        // External Storage URL — see PhotoUpload.tsx for why this isn't next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.media_url} alt={adName} className="size-full object-contain" />
      )}
    </div>
  );
}

/**
 * Renders one /audience ad gap (see AD_SLOTS, src/constants/ads.ts). `ad` is whichever
 * row (if any) landed on this slot's position after admin drag-reordering — a slot with
 * no ad, or an ad with no media yet, renders nothing.
 *
 * One ad can carry several media items, cycling through its own play/transition
 * duration: each item shows for playDurationSeconds, then crossfades (transitionMs) to
 * the next, looping back to the first. A single-item ad just holds that one item
 * indefinitely — no interval needed. object-contain (not cover) so portrait posters and
 * landscape banners both fit without cropping; items stack absolutely inside a fixed-
 * height box so the crossfade doesn't reflow the page as items with different aspect
 * ratios swap in.
 *
 * The cycle only starts once the slot has actually scrolled into view — most slots
 * start off-screen on a page this long, and there's no reason to run video/timers for
 * something nobody's looking at yet.
 */
export function AdSlot({ ad }: { ad: AdWithMedia | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!ad || ad.media.length === 0 || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ad]);

  useEffect(() => {
    if (!isVisible || !ad || ad.media.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % ad.media.length);
    }, ad.play_duration_seconds * 1000);

    return () => clearInterval(interval);
  }, [isVisible, ad]);

  if (!ad || ad.media.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative h-56 overflow-hidden rounded-2xl border-2 border-(--stage-gold) bg-(--stage-spotlight-deep) sm:h-72"
      style={{ opacity: isVisible ? 1 : 0, transition: `opacity ${ad.transition_duration_ms}ms ease-out` }}
    >
      {ad.media.map((item, index) => (
        <AdMediaFrame
          key={item.id}
          item={item}
          isCurrent={index === currentIndex}
          transitionMs={ad.transition_duration_ms}
          adName={ad.name}
        />
      ))}
    </div>
  );
}
