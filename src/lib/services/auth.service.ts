import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";
import { LOGIN_ROUTE, type Role } from "@/constants/roles";

export type AuthResult = { success: true } | { success: false; error: string };

/**
 * Wraps supabase.auth.signInWithPassword. The error message is intentionally generic
 * for every failure mode (wrong password, unknown email, unconfirmed account, ...) —
 * per docs/agents.md "never expose raw database errors," and to avoid letting a caller
 * distinguish "wrong password" from "no such account" (account enumeration).
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: "Incorrect email or password." };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export type CurrentUser = Pick<Profile, "id" | "name" | "email" | "role">;

/**
 * Reads the authenticated user's own profiles row — the only row RLS lets them read
 * (see supabase/migrations/..._profiles_self_read_policy.sql). Returns null both when
 * nobody is signed in AND when a profile row is unexpectedly missing for a signed-in
 * auth user; callers treat both the same way (send them to /login), since this app has
 * no self-signup path that could make the second case routine.
 *
 * Wrapped in React's cache() because a protected route's layout AND its page both call
 * this on every request (layout to gate access, page to show "signed in as ..."); this
 * makes the second call free instead of a duplicate round trip to Supabase.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single();

  return profile;
});

/**
 * Gate #2 of three (docs/decisions.md; src/app/README.md) — called from the admin/judge
 * layouts. Authoritative regardless of what src/proxy.ts already decided: Next.js's own
 * guidance, after a real middleware-bypass CVE, is that middleware is never sufficient
 * for authorization on its own.
 */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user || user.role !== role) {
    redirect(LOGIN_ROUTE);
  }

  return user;
}

export type AuthorizationResult = { ok: true } | { ok: false; error: string };

/**
 * For Server Actions, not pages — a redirect() (like requireRole) would be jarring UX
 * mid-dialog-submit, so this returns a typed result instead. services/README.md: "Verify
 * permissions inside every mutation. Do not assume the caller already checked; a Server
 * Action is a public endpoint" — the admin/judge layouts already gate the *page*, but
 * the action itself is a separate, directly-callable entry point.
 *
 * This is a UX nicety, not the real security boundary: every admin-only table's RLS
 * policy (Phase 7, is_admin()) enforces the same rule at the database regardless of
 * whether this check runs. A caller who somehow skipped this would still get rejected
 * by Postgres, just with a less friendly error.
 */
export async function assertAdmin(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return { ok: false, error: "You must be an admin to do that." };
  }

  return { ok: true };
}

/** Judge-side mirror of assertAdmin() — same reasoning, first used by Phase 12's
 * scoring Server Action. Real enforcement is judge_scores' RLS policies (Phase 7). */
export async function assertJudge(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();

  if (!user || user.role !== "judge") {
    return { ok: false, error: "You must be a judge to do that." };
  }

  return { ok: true };
}
