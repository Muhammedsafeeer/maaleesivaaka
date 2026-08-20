import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardTone = "primary" | "gold" | "blue" | "green" | "yellow" | "red";

/** Maps each tone to the same house/podium/primary color tokens already used
 * elsewhere on the dashboard (LiveJudgesPanel's house-yellow ring, Leaderboard's
 * podium-gold ring, ...) — reusing that palette instead of inventing a parallel one,
 * so a color means the same thing everywhere on the page. */
const TONE_CLASSES: Record<StatCardTone, { icon: string; bar: string; ring: string }> = {
  primary: { icon: "bg-primary/15 text-primary", bar: "bg-primary", ring: "hover:ring-primary/40" },
  gold: {
    icon: "bg-podium-gold/15 text-podium-gold",
    bar: "bg-podium-gold",
    ring: "hover:ring-podium-gold/40",
  },
  blue: {
    icon: "bg-house-blue/15 text-house-blue",
    bar: "bg-house-blue",
    ring: "hover:ring-house-blue/40",
  },
  green: {
    icon: "bg-house-green/15 text-house-green",
    bar: "bg-house-green",
    ring: "hover:ring-house-green/40",
  },
  yellow: {
    icon: "bg-house-yellow/15 text-house-yellow",
    bar: "bg-house-yellow",
    ring: "hover:ring-house-yellow/40",
  },
  red: { icon: "bg-house-red/15 text-house-red", bar: "bg-house-red", ring: "hover:ring-house-red/40" },
};

type StatCardProps = {
  label: string;
  value: number | string;
  href?: string;
  icon?: React.ReactNode;
  /** Defaults to "primary" (the theme's chartreuse) — pass one of the house/podium
   * tones to tie a card to the section it links into at a glance. */
  tone?: StatCardTone;
  className?: string;
};

/**
 * Shared by the admin dashboard (Phase 8) and, per components/README.md, the judge
 * dashboard later (Phase 12) — "Assigned/Pending/Completed Programs" there is the same
 * shape as "Total/Completed/Pending" here. Purely presentational: formatting a number
 * for display is fine here, deciding what counts as "completed" is not (that's the
 * service layer's job).
 *
 * When `href` is given the whole card becomes a link (e.g. "Students" → /admin/students)
 * with a hover/focus lift so it reads as clickable, not just decorative. The 1px top bar
 * is a deliberately small "life" touch, not a real trend indicator — this app doesn't
 * track these counts over time, so a sparkline would have to fake its data, which is
 * worse than not having one.
 */
export function StatCard({ label, value, href, icon, tone = "primary", className }: StatCardProps) {
  const t = TONE_CLASSES[tone];

  const card = (
    <Card
      size="sm"
      className={cn(
        "relative overflow-hidden transition-all duration-200 ease-out",
        href && cn("cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md", t.ring),
        className,
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1", t.bar)} />
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-normal text-muted-foreground">
          <span>{label}</span>
          {icon ? (
            <span className={cn("flex size-7 items-center justify-center rounded-lg", t.icon)}>
              {icon}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  );
}
