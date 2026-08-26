/**
 * Original inline SVG motifs for the Milad-un-Nabi audience theme (Phase 17) — crescent
 * and star, a fanous lantern, and a mosque dome silhouette. Drawn fresh in code, not
 * traced from the user's reference poster (that stays a palette/motif reference, never
 * an embedded asset — see PRODUCT.md's Brand Commitments).
 */

import { useId, type CSSProperties } from "react";

const CUP_TONES = {
  gold: { light: "#fff3c4", mid: "#f0b90b", deep: "#b8790a" },
  silver: { light: "#f4f6f8", mid: "#c3cad3", deep: "#8b95a1" },
  bronze: { light: "#f0c9a0", mid: "#c9773f", deep: "#8a4f28" },
} as const;

/**
 * A real illustrated trophy cup — a filled bowl, two curved handles, a stem, and a
 * two-tier base, shaded with a gradient and a shine highlight — instead of a generic
 * outline icon. Used on the Leading Houses podium (AudienceLeaderboard), one per
 * position, tone-matched to gold/silver/bronze. `useId()` keeps each instance's
 * gradient IDs unique so multiple cups on the same page (1st/2nd/3rd, all visible at
 * once) don't clash.
 */
export function TrophyCup({
  className,
  tone = "gold",
}: {
  className?: string;
  tone?: keyof typeof CUP_TONES;
}) {
  const id = useId();
  const c = CUP_TONES[tone];

  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.deep} />
        </linearGradient>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.deep} />
        </linearGradient>
      </defs>

      {/* handles */}
      <path
        d="M14 16c-7 0-10 5-10 10s3 11 12 12"
        fill="none"
        stroke={`url(#${id}-body)`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M50 16c7 0 10 5 10 10s-3 11-12 12"
        fill="none"
        stroke={`url(#${id}-body)`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* bowl */}
      <path
        d="M15 14h34v10c0 12-9 20-17 20s-17-8-17-20V14Z"
        fill={`url(#${id}-body)`}
      />
      {/* shine highlight */}
      <path
        d="M22 17c-1 8 1 15 6 19"
        fill="none"
        stroke={c.light}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* rim */}
      <rect x="13" y="10" width="38" height="6" rx="3" fill={`url(#${id}-body)`} />

      {/* stem */}
      <path d="M29 44h6v9h-6z" fill={`url(#${id}-base)`} />

      {/* base */}
      <rect x="20" y="53" width="24" height="6" rx="2" fill={`url(#${id}-base)`} />
      <rect x="16" y="59" width="32" height="7" rx="2" fill={`url(#${id}-base)`} />
    </svg>
  );
}

export function CrescentStar({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M22 6a14 14 0 1 0 0 28 11 11 0 0 1 0-28Z"
        fill="currentColor"
      />
      <path
        d="m32 8 1.1 2.9L36 12l-2.9 1.1L32 16l-1.1-2.9L28 12l2.9-1.1L32 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Lantern({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 40" fill="none" className={className} aria-hidden="true">
      <path d="M12 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5 4h14l-1.5 5h-11L5 4Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M4 9h16l-2.5 20a1.5 1.5 0 0 1-1.5 1.3h-8a1.5 1.5 0 0 1-1.5-1.3L4 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M6.5 9v18M12 9v20M17.5 9v18" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="12" cy="18" r="3.2" fill="currentColor" opacity="0.85" />
      <path d="M9 34h6l-1 4h-4l-1-4Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function DomeSilhouette({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 60"
      fill="none"
      className={className}
      style={style}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        d="M0 60V44h14V30h6V20h10V10h6a24 24 0 0 1 48 0h6v10h10v10h6v14h8V30h6V18h8v6h4V18h8v6h4v-6h8v12h6v14h8V38h6v6h20V60H0Z"
        fill="currentColor"
      />
      <path d="M97 0v10M91 5h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
