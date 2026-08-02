"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

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

function titleFor(pathname: string): string {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.title ?? "";
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{titleFor(pathname)}</h1>
      </div>
    </header>
  );
}
