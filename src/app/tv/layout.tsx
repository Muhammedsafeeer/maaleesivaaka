import type { Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { TV_CRITICAL_CSS } from "@/features/tv/tvFitBoot";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
      style={{ fontFamily: "var(--font-audience-ui)", background: "#1a1028", height: "100%" }}
    >
      <style dangerouslySetInnerHTML={{ __html: TV_CRITICAL_CSS }} />
      <div id="tv-boot-debug" suppressHydrationWarning>
        tv · meta refresh…
      </div>
      {children}
    </div>
  );
}
