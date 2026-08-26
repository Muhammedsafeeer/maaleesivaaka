"use client";

import { useEffect, useRef, useState } from "react";
import type { AdMedia, AdWithMedia } from "@/types/ad";

function AdMediaFrame({
  item,
  isCurrent,
  transitionMs,
}: {
  item: AdMedia;
  isCurrent: boolean;
  transitionMs: number;
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
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        textAlign: "center",
        opacity: isCurrent ? 1 : 0,
        transition: `opacity ${transitionMs}ms ease-out`,
      }}
    >
      {item.media_type === "video" ? (
        <video
          ref={videoRef}
          src={item.media_url}
          muted
          loop
          playsInline
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.media_url} alt="" className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
}

/**
 * One pushed ad (/admin/ads "Push to TV") as its own full-screen slot in the main TV
 * rotation — TvSlideshow gives it a slide of its own, same as Standings/Latest Winner/
 * etc. Sibling of AdSlot (the /audience version), not a shared component: AdSlot's
 * IntersectionObserver-gated lazy start exists specifically for a long scrollable page
 * where slots start off-screen — here the slide is only ever mounted while it's the
 * active slide, so it can just start its own media cycle immediately.
 */
export function AdTvSlide({ ad }: { ad: AdWithMedia }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ad.media.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentIndex((i) => (i + 1) % ad.media.length);
    }, ad.play_duration_seconds * 1000);
    return () => window.clearInterval(interval);
  }, [ad]);

  if (ad.media.length === 0) return null;

  return (
    <div className="relative h-full w-full p-(--tv-64)">
      {ad.media.map((item, index) => (
        <AdMediaFrame
          key={item.id}
          item={item}
          isCurrent={index === currentIndex}
          transitionMs={ad.transition_duration_ms}
        />
      ))}
    </div>
  );
}
