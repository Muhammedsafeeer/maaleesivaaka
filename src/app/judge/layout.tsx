import Link from "next/link";
import { requireRole } from "@/lib/services/auth.service";
import { logoutAction } from "@/features/auth/actions/logout.action";
import { Button } from "@/components/ui/button";

/**
 * No nav component here (unlike AdminNav) — the judge side is just this dashboard plus
 * per-program detail pages reached by clicking into them, not a multi-section app that
 * needs top-level navigation.
 */
export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("judge");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <Link href="/judge" className="font-heading text-sm font-medium">
          Judge Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
