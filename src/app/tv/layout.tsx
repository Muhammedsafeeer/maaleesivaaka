import { Playfair_Display, DM_Sans } from "next/font/google";

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
      className={`audience-shell h-full ${displayFont.variable} ${uiFont.variable}`}
      style={{ fontFamily: "var(--font-audience-ui)" }}
    >
      {children}
    </div>
  );
}
