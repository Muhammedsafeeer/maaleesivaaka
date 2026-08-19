import type { Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";

/**
 * Overrides the root layout's viewport (src/app/layout.tsx) for this route only.
 * Locking zoom is safe here specifically because /tv is an unattended kiosk display
 * with no pinch-zoom-worthy interaction (see the page-level comment on TvPage) —
 * elsewhere in the app users may legitimately want to pinch-zoom, so this isn't
 * applied globally. Some TV browsers apply their own default zoom via the same
 * pinch-zoom mechanism `userScalable`/`maximumScale` govern; locking it out removes
 * one possible source of size drift independent of the fluid `.tv-shell` sizing
 * (globals.css) that now does the actual scaling work via CSS, not JS.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/** Same scoped font pair as /audience (src/app/audience/layout.tsx) — the TV page
 * shares that visual identity rather than inventing a second one. */
const displayFont = Playfair_Display({
  variable: "--font-audience-display",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

const uiFont = DM_Sans({
  variable: "--font-audience-ui",
  subsets: ["latin"],
});

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`audience-shell tv-shell h-full ${displayFont.variable} ${uiFont.variable}`}
      style={{ fontFamily: "var(--font-audience-ui)" }}
    >
      {children}
    </div>
  );
}
