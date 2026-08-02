import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/**
 * Fonts load through `next/font`, which self-hosts them at build time. Nothing is
 * requested from Google at runtime — one less third-party round trip for a projector on
 * school wifi, and no layout shift while a webfont downloads.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "School Function Judging & Live Score Management",
    template: "%s · School Function",
  },
  description:
    "Manage students, programs and judges, score from any device, and follow results and house leaderboards live.",
};

/**
 * `viewportFit: "cover"` matters for the audience view — on a phone with a notch it lets
 * the fullscreen leaderboard use the whole screen.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
