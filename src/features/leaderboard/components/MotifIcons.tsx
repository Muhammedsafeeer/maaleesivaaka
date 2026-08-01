/**
 * Original inline SVG motifs for the Milad-un-Nabi audience theme (Phase 17) — crescent
 * and star, a fanous lantern, and a mosque dome silhouette. Drawn fresh in code, not
 * traced from the user's reference poster (that stays a palette/motif reference, never
 * an embedded asset — see PRODUCT.md's Brand Commitments).
 */

export function CrescentStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
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

export function DomeSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      fill="none"
      className={className}
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
