"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UnresolvedTieProgram } from "@/lib/services/result.service";

const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/admin/groups", title: "Groups" },
  { prefix: "/admin/students", title: "Students" },
  { prefix: "/admin/programs", title: "Programs" },
  { prefix: "/admin/fixture", title: "Fixture" },
  { prefix: "/admin/judges", title: "Judges" },
  { prefix: "/admin/leaderboard", title: "Leaderboard" },
  { prefix: "/admin/settings", title: "Settings" },
  { prefix: "/admin", title: "Dashboard" },
  { prefix: "/judge", title: "Dashboard" },
];

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

function titleFor(pathname: string): string {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "";
}

const DASHBOARD_ROOTS = new Set(["/admin", "/judge"]);

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The greeting/date reads the visitor's local clock, which the server can't know in
 * advance (and often runs in a different timezone entirely — Vercel's build region vs.
 * wherever the admin actually is). Same tradeoff TvHeader's live clock already makes
 * (src/features/tv/components/TvHeader.tsx): compute once from a real `Date` via a
 * lazy useState initializer rather than deriving it in an effect (an unconditional
 * setState there would just be re-deriving state React already has a value for, which
 * is exactly what the set-state-in-effect lint rule is warning against), and mark the
 * rendered text `suppressHydrationWarning` — worst case a server-timezone-off value
 * flashes for one frame before hydration corrects it to the visitor's real local time.
 */
function useLocalGreeting(): { greeting: string; date: string } {
  const [value] = useState(() => {
    const now = new Date();
    return {
      greeting: greetingFor(now.getHours()),
      date: now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    };
  });

  return value;
}

/**
 * Admin-only tie notification bell — mirrors TiesReviewPanel's data (same
 * listUnresolvedTies() source, fetched once in AdminLayout so it's fresh on every admin
 * page, not just the dashboard) in a compact dropdown rather than sharing a component
 * with the full card: the two contexts render differently enough (menu vs. card) that
 * a shared component would cost more than the handful of duplicated lines here.
 */
function TiesBell({ ties }: { ties: UnresolvedTieProgram[] }) {
  if (ties.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Ties needing a decision">
          <Bell className="size-4" />
          <Badge
            variant="destructive"
            className="animate-in zoom-in absolute -top-1 -right-1 size-4 justify-center rounded-full p-0 text-[0.6rem] duration-300"
          >
            {ties.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Ties needing a decision</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ties.map((tie) => (
          <DropdownMenuItem key={tie.programId} asChild className="flex-col items-start gap-0.5">
            <Link href={`/admin/programs/${tie.programId}`}>
              <span className="text-sm font-medium">{tie.programName}</span>
              {tie.groups.map((group) => (
                <span key={group.position} className="text-xs text-muted-foreground">
                  {POSITION_LABELS[group.position] ?? `#${group.position}`} —{" "}
                  {group.participants.map((p) => p.name).join(" and ")}
                </span>
              ))}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader({
  role,
  userName,
  unresolvedTies = [],
}: {
  role: "admin" | "judge";
  userName?: string;
  unresolvedTies?: UnresolvedTieProgram[];
}) {
  const pathname = usePathname();
  const local = useLocalGreeting();
  const isDashboardRoot = DASHBOARD_ROOTS.has(pathname);
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex-1">
          {isDashboardRoot && firstName ? (
            <>
              <h1 className="text-base font-medium" suppressHydrationWarning>
                {local.greeting}, {firstName}
              </h1>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {local.date}
              </p>
            </>
          ) : (
            <h1 className="text-base font-medium">{titleFor(pathname)}</h1>
          )}
        </div>
        {role === "admin" ? <TiesBell ties={unresolvedTies} /> : null}
      </div>
    </header>
  );
}
