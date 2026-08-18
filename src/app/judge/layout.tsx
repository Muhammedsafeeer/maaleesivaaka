import { requireRole } from "@/lib/services/auth.service";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { JudgePresenceTracker } from "@/components/dashboard/JudgePresenceTracker";

/**
 * Same sidebar shell as /admin (src/components/app-sidebar.tsx), just with a
 * single-item nav — the judge side is still just this dashboard plus per-program
 * detail pages reached by clicking into them, not a multi-section app, but it gets the
 * same polished chrome (collapsible sidebar, user menu, sign out) rather than a
 * separate plain header.
 */
export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("judge");

  return (
    <SidebarProvider
      className="dashboard-shell"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar role="judge" user={user} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <JudgePresenceTracker user={user} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
