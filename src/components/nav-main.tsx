"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type NavMainItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  /** Exact match only (e.g. the section root) — every other item highlights on prefix. */
  exact?: boolean;
  /** Items sharing a group render under one labeled section, in first-seen group
   * order; an item with no group renders in its own unlabeled section above/between
   * labeled ones (e.g. "Dashboard" sitting alone above the labeled sections). Omit
   * entirely (the judge nav's single item) to fall back to one flat, unlabeled list. */
  group?: string;
};

function groupItems(items: NavMainItem[]): { label: string | null; items: NavMainItem[] }[] {
  const sections: { label: string | null; items: NavMainItem[] }[] = [];
  for (const item of items) {
    const label = item.group ?? null;
    const last = sections[sections.length - 1];
    // Ungrouped items never merge with each other (each is its own section, so e.g.
    // two consecutive ungrouped items don't silently share a section) — only
    // same-named groups merge.
    if (last && label !== null && last.label === label) {
      last.items.push(item);
    } else {
      sections.push({ label, items: [item] });
    }
  }
  return sections;
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const sections = groupItems(items);

  return (
    <>
      {sections.map((section, i) => (
        <SidebarGroup key={section.label ?? `ungrouped-${i}`}>
          {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <Link href={item.url} onClick={() => setOpenMobile(false)}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
