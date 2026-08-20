import { requireRole } from "@/lib/services/auth.service";
import { listUnresolvedTies } from "@/lib/services/result.service";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, unresolvedTies] = await Promise.all([
    requireRole("admin"),
    listUnresolvedTies(),
  ]);

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
      <AppSidebar role="admin" user={user} variant="inset" />
      <SidebarInset>
        <RealtimeLeaderboardListener />
        <SiteHeader role="admin" userName={user.name} unresolvedTies={unresolvedTies} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
