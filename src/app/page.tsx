import { redirect } from "next/navigation";

/**
 * The audience dashboard is the real landing page now (Phase 16) — visitors loading the
 * site should land straight on the live leaderboard/results, not a placeholder screen.
 * `/audience` stays the canonical implementation (PUBLIC_ROUTES, revalidatePath calls in
 * fixture.actions.ts, and any bookmarks already point there) so this just redirects
 * rather than duplicating the page.
 */
export default function Home() {
  redirect("/audience");
}
