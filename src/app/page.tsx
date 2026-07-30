import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LOGIN_ROUTE } from "@/constants/roles";

/**
 * The real landing page, replacing Phase 1's setup-verification page now that roles
 * have somewhere to go (Phase 6). Deliberately minimal — the audience leaderboard isn't
 * built until Phase 16, so this doesn't link to it yet.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          School Function Judging &amp; Live Score Management
        </h1>
        <p className="text-pretty text-muted-foreground">
          Score submission, results, and the house leaderboard for admins and judges.
        </p>
      </div>
      <Button asChild>
        <Link href={LOGIN_ROUTE}>Sign in</Link>
      </Button>
    </main>
  );
}
