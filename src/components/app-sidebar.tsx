"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  MegaphoneIcon,
  LayoutTemplateIcon,
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
  useSidebar,
} from "@/components/ui/sidebar";
import type { Role } from "@/constants/roles";

const ADMIN_NAV: NavMainItem[] = [
  { title: "Dashboard", url: "/admin", icon: <LayoutDashboardIcon />, exact: true },
  { title: "Groups", url: "/admin/groups", icon: <UsersIcon />, group: "People" },
  { title: "Students", url: "/admin/students", icon: <GraduationCapIcon />, group: "People" },
  { title: "Judges", url: "/admin/judges", icon: <GavelIcon />, group: "People" },
  { title: "Programs", url: "/admin/programs", icon: <ListMusicIcon />, group: "Event" },
  { title: "Fixture", url: "/admin/fixture", icon: <CalendarClockIcon />, group: "Event" },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: <TrophyIcon />, group: "Event" },
  { title: "Certificates", url: "/admin/certificates", icon: <AwardIcon />, group: "Content" },
  { title: "Results Poster", url: "/admin/results-poster", icon: <ImageIcon />, group: "Content" },
  {
    title: "Poster Settings",
    url: "/admin/poster-settings",
    icon: <LayoutTemplateIcon />,
    group: "Content",
  },
  { title: "Ads", url: "/admin/ads", icon: <MegaphoneIcon />, group: "Content" },
  { title: "Settings", url: "/admin/settings", icon: <Settings2Icon />, group: "System" },
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
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link
                href={role === "admin" ? "/admin" : "/judge"}
                onClick={() => setOpenMobile(false)}
              >
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
