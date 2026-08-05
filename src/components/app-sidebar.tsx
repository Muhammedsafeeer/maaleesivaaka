"use client";

import Link from "next/link";
import {
  LayoutDashboardIcon,
  UsersIcon,
  GraduationCapIcon,
  ListMusicIcon,
  CalendarClockIcon,
  GavelIcon,
  TrophyIcon,
  AwardIcon,
  ImageIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";
import { NavMain, type NavMainItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Role } from "@/constants/roles";

const ADMIN_NAV: NavMainItem[] = [
  { title: "Dashboard", url: "/admin", icon: <LayoutDashboardIcon />, exact: true },
  { title: "Groups", url: "/admin/groups", icon: <UsersIcon /> },
  { title: "Students", url: "/admin/students", icon: <GraduationCapIcon /> },
  { title: "Programs", url: "/admin/programs", icon: <ListMusicIcon /> },
  { title: "Fixture", url: "/admin/fixture", icon: <CalendarClockIcon /> },
  { title: "Judges", url: "/admin/judges", icon: <GavelIcon /> },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: <TrophyIcon /> },
  { title: "Certificates", url: "/admin/certificates", icon: <AwardIcon /> },
  { title: "Results Poster", url: "/admin/results-poster", icon: <ImageIcon /> },
  { title: "Settings", url: "/admin/settings", icon: <Settings2Icon /> },
];

const JUDGE_NAV: NavMainItem[] = [
  { title: "Dashboard", url: "/judge", icon: <LayoutDashboardIcon />, exact: true },
];

export function AppSidebar({
  role,
  user,
  ...props
}: {
  role: Role;
  user: { name: string; email: string };
} & React.ComponentProps<typeof Sidebar>) {
  const items = role === "admin" ? ADMIN_NAV : JUDGE_NAV;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href={role === "admin" ? "/admin" : "/judge"}>
                <SparklesIcon className="size-5!" />
                <span className="text-base font-semibold">
                  {role === "admin" ? "Admin" : "Judge"} Panel
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
