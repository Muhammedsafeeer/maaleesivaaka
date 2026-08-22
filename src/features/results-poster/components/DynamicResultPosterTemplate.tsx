"use client";

import { useState } from "react";
import {
  Manjari,
  Noto_Sans_Malayalam,
  Montserrat,
  Merriweather,
  Oswald,
  Dancing_Script,
  Baloo_2,
} from "next/font/google";
import type { PosterField } from "@/constants/poster";
import type { PosterSettings } from "@/lib/services/posterSettings.service";
import type { PublishedProgramPodiumRow } from "@/lib/services/result.service";

// Same reasoning as ResultPosterTemplate's malayalamFont: the admin-designed layout
// has no guaranteed font of its own, so Malayalam-keyed fields need this loaded
// explicitly rather than depending on whatever's installed on the machine
// downloading the poster.
const malayalamFont = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["600"] });
const malayalamSerifFont = Manjari({ subsets: ["malayalam"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "900"] });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"] });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600", "700"] });
const baloo2 = Baloo_2({ subsets: ["latin"], weight: ["500", "700"] });

// Output width is fixed for a crisp capture (generatePosterImage.ts captures this DOM
// box pixel-for-pixel, same CAPTURE_SCALE reasoning as the certificate pipeline);
// height instead follows the background's own natural aspect ratio (see
// backgroundAspectRatio state below) rather than a fixed 3:4 box — a fixed box
// cropped the sides off anything that wasn't already that shape (e.g. a square
// upload). FALLBACK_ASPECT_RATIO only applies for the instant before the background
// <img> below fires onLoad.
const POSTER_WIDTH = 1080;
const FALLBACK_ASPECT_RATIO = 3 / 4;

function fontFamilyFor(fontFamily: PosterField["fontFamily"], isMalayalam: boolean) {
  if (isMalayalam) {
    switch (fontFamily) {
      case "malayalam_serif":
        return malayalamSerifFont.style.fontFamily;
      case "malayalam_sans":
      default:
        return malayalamFont.style.fontFamily;
    }
  }

  switch (fontFamily) {
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "mono":
      return "var(--font-geist-mono), monospace";
    case "display_bold":
      return montserrat.style.fontFamily;
    case "classic_serif":
      return merriweather.style.fontFamily;
    case "condensed":
      return oswald.style.fontFamily;
    case "script":
      return dancingScript.style.fontFamily;
    case "rounded":
      return baloo2.style.fontFamily;
    default:
      return "var(--font-geist-sans), sans-serif";
  }
}

type PodiumEntry = PublishedProgramPodiumRow["podium"][number];

function textFor(
  field: PosterField,
  programName: string,
  programMalayalamName: string | null,
  categoryLabel: string,
  categoryMalayalamLabel: string,
  podium: PodiumEntry[],
): string | null {
  if (field.key === "program_name") return programName;
  if (field.key === "program_name_malayalam") return programMalayalamName;
  if (field.key === "category") return categoryLabel;
  if (field.key === "category_malayalam") return categoryMalayalamLabel;
  if (field.key === "footer") return field.staticText ?? null;

  const match = /^position_(\d)_(name|group|points|name_malayalam|group_malayalam)$/.exec(field.key);
  if (!match) return null;
  const position = Number(match[1]);
  const attr = match[2];
  const entry = podium.find((e) => e.position === position);
  if (!entry) return null;

  switch (attr) {
    case "name":
      return entry.studentName;
    case "name_malayalam":
      return entry.studentMalayalamName;
    case "group":
      return entry.groupName;
    case "group_malayalam":
      return entry.groupMalayalamName;
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
  programMalayalamName,
  categoryLabel,
  categoryMalayalamLabel,
  podium,
}: {
  settings: PosterSettings;
  programName: string;
  programMalayalamName: string | null;
  categoryLabel: string;
  categoryMalayalamLabel: string;
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

          const text = textFor(field, programName, programMalayalamName, categoryLabel, categoryMalayalamLabel, podium);
          if (!text) return null;
          const isMalayalam = field.key.endsWith("_malayalam");
          // Anchor x/y always mark the field's own left/center/right edge, not its visual
          // center — a nowrap single-line <p> shrinks its box to fit the text, so
          // text-align alone (which only affects extra space *inside* the box) has no
          // visible effect unless the box itself is also pinned by that same edge.
          const translateX = field.align === "left" ? "0%" : field.align === "right" ? "-100%" : "-50%";

          return (
            <p
              key={field.key}
              className="absolute whitespace-nowrap"
              style={{
                left: `${field.x * 100}%`,
                top: `${field.y * 100}%`,
                transform: `translate(${translateX}, -50%)`,
                color: field.color,
                fontSize: field.fontSize * 2.5,
                fontWeight: field.bold ? 700 : 400,
                fontStyle: field.italic ? "italic" : "normal",
                textAlign: field.align,
                fontFamily: fontFamilyFor(field.fontFamily, isMalayalam),
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
