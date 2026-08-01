"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/fixture", label: "Fixture" },
  { href: "/admin/judges", label: "Judges" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/**
 * "Page shells shared by admin and judge" per components/README.md — this one is
 * admin-specific; a judge-specific sibling arrives in Phase 12 rather than forcing a
 * shared nav abstraction now for a single current usage.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
        // Exact match for "/admin" (it's a prefix of every other admin route);
        // startsWith for the rest so a nested route (e.g. /admin/students/123, if one
        // is ever added) still highlights its section.
        const isActive =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
