import { Playfair_Display, DM_Sans } from "next/font/google";

/**
 * Fonts scoped to this route only (Phase 17 redesign) — Playfair Display for
 * ornamental gold headings, DM Sans for dense tabular data. Deliberately not added to
 * the root layout: admin/judge keep the Geist stack, only /audience gets the
 * Milad-un-Nabi visual identity.
 */
const displayFont = Playfair_Display({
  variable: "--font-audience-display",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

const uiFont = DM_Sans({
  variable: "--font-audience-ui",
  subsets: ["latin"],
});

export default function AudienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`audience-shell dark min-h-full ${displayFont.variable} ${uiFont.variable}`}
      style={{ fontFamily: "var(--font-audience-ui)" }}
    >
      {children}
    </div>
  );
}
