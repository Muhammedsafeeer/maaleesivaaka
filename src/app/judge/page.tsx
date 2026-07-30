import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/services/auth.service";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/logout.action";

export const metadata: Metadata = {
  title: "Judge",
};

/**
 * Throwaway verification page, same as src/app/page.tsx was in Phase 1 — proves the
 * auth flow works end to end (login -> redirect -> land here -> logout). Phase 12
 * replaces this with the real judge dashboard.
 */
export default async function JudgeHomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div>
        <h1 className="font-heading text-xl font-medium">Judge dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.name} ({user?.email}). The real dashboard arrives in
          Phase 12.
        </p>
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}
