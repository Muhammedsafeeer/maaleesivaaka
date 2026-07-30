import { Button } from "@/components/ui/button";
import { POSITION_POINTS, ROLES, SCORE_MAX, SCORE_MIN } from "@/constants";

/**
 * Temporary setup-verification page.
 *
 * This is a Server Component — no `"use client"`, so none of this code reaches the
 * browser. It exists to prove the Phase 1 toolchain works end to end (Tailwind v4 tokens,
 * shadcn/ui, self-hosted fonts, the `@/` import alias, the constants module) and will be
 * replaced by the real landing page once roles have somewhere to go.
 */

const HOUSE_SWATCHES = [
  { name: "Red House", className: "bg-house-red" },
  { name: "Blue House", className: "bg-house-blue" },
  { name: "Green House", className: "bg-house-green" },
  { name: "Yellow House", className: "bg-house-yellow" },
] as const;

const PODIUM_SWATCHES = [
  { position: "1st", points: POSITION_POINTS[1], className: "bg-podium-gold" },
  { position: "2nd", points: POSITION_POINTS[2], className: "bg-podium-silver" },
  { position: "3rd", points: POSITION_POINTS[3], className: "bg-podium-bronze" },
] as const;

const UPCOMING = [
  { phase: "Phase 2", label: "Git repository and environment files" },
  { phase: "Phase 3", label: "Supabase project" },
  { phase: "Phase 4", label: "Supabase connected to Next.js" },
  { phase: "Phase 5", label: "Database schema and migrations" },
  { phase: "Phase 6", label: "Authentication and protected routes" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Phase 1 complete
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          School Function Judging &amp; Live Score Management
        </h1>
        <p className="max-w-prose text-pretty text-muted-foreground">
          The project skeleton is in place. Roles have no destination yet — routing and
          authentication arrive in Phase 6.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Roles</h2>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <Button key={role.value} variant="outline" disabled>
              {role.label}
            </Button>
          ))}
          <Button variant="outline" disabled>
            Audience — no login
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">House colours</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HOUSE_SWATCHES.map((house) => (
            <div
              key={house.name}
              className="flex flex-col gap-2 rounded-lg border border-border p-3"
            >
              <span
                className={`h-8 w-full rounded-md ${house.className}`}
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">{house.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">
          Points per position{" "}
          <span className="font-normal text-muted-foreground">
            (scores {SCORE_MIN}–{SCORE_MAX})
          </span>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {PODIUM_SWATCHES.map((podium) => (
            <div
              key={podium.position}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <span
                className={`size-8 shrink-0 rounded-full ${podium.className}`}
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{podium.position}</span>
                <span className="text-xs text-muted-foreground">
                  {podium.points} {podium.points === 1 ? "point" : "points"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Next</h2>
        <ul className="flex flex-col gap-2">
          {UPCOMING.map((item) => (
            <li
              key={item.phase}
              className="flex items-baseline gap-3 text-sm text-muted-foreground"
            >
              <span className="font-mono text-xs tabular-nums">{item.phase}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
