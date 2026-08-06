"use client";

import { useState } from "react";
import type { PosterField } from "@/constants/poster";
import type { PosterSettings } from "@/lib/services/posterSettings.service";
import type { PublishedProgramPodiumRow } from "@/lib/services/result.service";

// Output width is fixed for a crisp capture (generatePosterImage.ts captures this DOM
// box pixel-for-pixel, same CAPTURE_SCALE reasoning as the certificate pipeline);
// height instead follows the background's own natural aspect ratio (see
// backgroundAspectRatio state below) rather than a fixed 3:4 box — a fixed box
// cropped the sides off anything that wasn't already that shape (e.g. a square
// upload). FALLBACK_ASPECT_RATIO only applies for the instant before the background
// <img> below fires onLoad.
const POSTER_WIDTH = 1080;
const FALLBACK_ASPECT_RATIO = 3 / 4;

type PodiumEntry = PublishedProgramPodiumRow["podium"][number];

function textFor(field: PosterField, programName: string, categoryLabel: string, podium: PodiumEntry[]): string | null {
  if (field.key === "program_name") return programName;
  if (field.key === "category") return categoryLabel;
  if (field.key === "footer") return field.staticText ?? null;

  const match = /^position_(\d)_(name|group|points)$/.exec(field.key);
  if (!match) return null;
  const position = Number(match[1]);
  const attr = match[2];
  const entry = podium.find((e) => e.position === position);
  if (!entry) return null;

  switch (attr) {
    case "name":
      return entry.studentName;
    case "group":
      return entry.groupName;
    case "points":
      return `${entry.points}`;
    default:
      return null;
  }
}

function photoFor(field: PosterField, podium: PodiumEntry[]): string | null {
  const match = /^position_(\d)_photo$/.exec(field.key);
  if (!match) return null;
  const position = Number(match[1]);
  return podium.find((e) => e.position === position)?.photoUrl ?? null;
}

/**
 * Poster rendering driven by an admin-designed layout (Poster Settings) instead of
 * ResultPosterTemplate's fixed public/poster.jpg + hardcoded CSS offsets — same
 * `.poster-page` capture contract (PosterDownloadPortal/generatePosterImage.ts query
 * that class name generically, so this drops in as a straight alternative), just
 * populated from poster_settings.fields instead of ROW_CENTER_Y.
 */
export function DynamicResultPosterTemplate({
  settings,
  programName,
  categoryLabel,
  podium,
}: {
  settings: PosterSettings;
  programName: string;
  categoryLabel: string;
  podium: PodiumEntry[];
}) {
  const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
  const posterHeight = Math.round(POSTER_WIDTH / aspectRatio);

  return (
    <div
      className="poster-page relative overflow-hidden"
      style={{ width: POSTER_WIDTH, height: posterHeight, backgroundColor: "#123a26" }}
    >
      {settings.backgroundUrl ? (
        // The onLoad here is what generatePosterImage.ts's waitForImages() already
        // waits on before capturing — by the time that promise resolves, this element
        // has fired, so the aspect-ratio-driven container height above is settled
        // before html2canvas runs. crossOrigin is required for the same reason as the
        // per-podium photos below: an uncredentialed cross-origin image taints the
        // capture canvas.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.backgroundUrl}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 size-full object-cover"
          onLoad={(e) => {
            const el = e.currentTarget;
            if (el.naturalWidth && el.naturalHeight) {
              setAspectRatio(el.naturalWidth / el.naturalHeight);
            }
          }}
        />
      ) : null}

      {settings.fields
        .filter((f) => f.visible)
        .map((field) => {
          if (field.type === "photo") {
            const url = photoFor(field, podium);
            const size = field.photoSize * POSTER_WIDTH;
            return (
              <div
                key={field.key}
                className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-black/20"
                style={{ left: `${field.x * 100}%`, top: `${field.y * 100}%`, width: size, height: size }}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" crossOrigin="anonymous" className="size-full object-cover" />
                ) : null}
              </div>
            );
          }

          const text = textFor(field, programName, categoryLabel, podium);
          if (!text) return null;

          return (
            <p
              key={field.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
              style={{
                left: `${field.x * 100}%`,
                top: `${field.y * 100}%`,
                color: field.color,
                fontSize: field.fontSize * 2.5,
                fontWeight: field.bold ? 700 : 400,
                textAlign: field.align,
                textShadow: "0 2px 6px rgba(0,0,0,0.6)",
              }}
            >
              {text}
            </p>
          );
        })}
    </div>
  );
}
