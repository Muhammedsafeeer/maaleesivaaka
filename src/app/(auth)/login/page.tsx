import type { Metadata } from "next";
import Link from "next/link";
import { Gavel, Trophy, Award, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Lantern, CrescentStar, DomeSilhouette } from "@/features/leaderboard/components/MotifIcons";

export const metadata: Metadata = {
  title: "Sign in",
};

const FEATURES = [
  { icon: Gavel, text: "Score any program from a phone or laptop, live." },
  { icon: Trophy, text: "Publish results and watch the leaderboard update instantly." },
  { icon: Award, text: "Generate certificates and share-ready result posters." },
];

/**
 * Split-panel sign-in — the dark decorative side reuses the admin/judge system's own
 * `.dashboard-shell` tokens (cream + chartreuse) scoped to this page only, same pattern
 * `admin/layout.tsx`'s SidebarProvider uses, so no other route picks up the theme.
 * Deliberately NOT the `.audience-shell` system (DESIGN.md: "this is not a whole-product
 * rebrand", scoped to /audience only) — this page serves admin/judge sign-in, so it stays
 * on the neutral shadcn/Geist type system, just dressed up. The crescent/lantern/dome
 * motifs are the same original inline SVGs the audience page uses (not gated to that
 * page, just first drawn for it), reused here in the dashboard's own colours rather than
 * the audience gold/green — the real banner image itself is never re-embedded outside
 * its one masthead spot.
 */
export default function LoginPage() {
  return (
    <div className="dashboard-shell relative flex min-h-full flex-col bg-background lg:flex-row">
      {/* Decorative panel — hidden below lg, where the form takes the full screen. */}
      <div className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <CrescentStar className="pointer-events-none absolute top-16 right-16 size-10 text-primary/25" />
        <CrescentStar className="pointer-events-none absolute bottom-40 left-10 size-6 text-primary/15" />

        <div className="relative flex items-center gap-2 text-sm font-medium text-background/70">
          <Lantern className="lantern-glow size-5 text-primary" />
          Maalee Sivaa Ka
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl leading-tight font-semibold text-balance">
              Sign in to keep the show running.
            </h1>
            <p className="max-w-sm text-base text-background/70">
              Score programs, publish results, and keep the festival moving — from
              whichever device you have on hand.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </span>
                <span className="text-sm text-background/80">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-background/40">
          Muhyudheen Jumamasjid · Chayyoth
        </p>

        <DomeSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-background/5" />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-10">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground lg:hidden">
          <Lantern className="lantern-glow size-5 text-primary" />
          Maalee Sivaa Ka
        </div>

        <Card className="w-full max-w-sm rounded-2xl py-6 shadow-lg ring-1 ring-border/60">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Admin and judge accounts only. Enter the email and password you were given.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <Link
          href="/audience"
          className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          View the public audience page instead
        </Link>
      </div>
    </div>
  );
}
