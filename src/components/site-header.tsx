"use client";

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
  unresolvedTies = [],
}: {
  role: "admin" | "judge";
  unresolvedTies?: UnresolvedTieProgram[];
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="flex-1 text-base font-medium">{titleFor(pathname)}</h1>
        {role === "admin" ? <TiesBell ties={unresolvedTies} /> : null}
      </div>
    </header>
  );
}
