import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
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

/**
 * Admin emails to try a password against for verifyAdminPassword() below. Uses the
 * service role key — a judge's own RLS-scoped session can only read its own profiles
 * row, not other admins' emails — but only to read `role`/`email`, never anything
 * sensitive, and the key itself never leaves this server-only module.
 */
async function listAdminEmails(): Promise<string[]> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return [];
  }

  try {
    const client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data } = await client.from("profiles").select("email").eq("role", "admin");
    return (data ?? []).map((row) => row.email);
  } catch {
    return [];
  }
}

/**
 * Verifies a password belongs to *some* admin, WITHOUT touching the caller's own
 * session — used by scoring.service.ts to gate a judge re-editing an already-submitted
 * score. Only a password is asked for (not which admin), so this tries it against each
 * admin account in turn.
 *
 * Each attempt uses a fresh, standalone client (raw @supabase/supabase-js, not
 * lib/supabase/server's cookie-bound one) with persistSession/autoRefreshToken off, so
 * signing in here never writes cookies or otherwise touches the judge's actual
 * signed-in session. Deliberately does NOT call signOut() afterwards: persistSession
 * false means nothing was ever stored locally to clean up, and signOut()'s default
 * 'global' scope would revoke that admin's refresh token everywhere — including a
 * session they're actively using elsewhere — for no benefit. Every Supabase call is
 * wrapped so a transient failure (network hiccup, rate limit) resolves to "not
 * verified" instead of throwing out of a Server Action.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password) {
    return false;
  }

  const adminEmails = await listAdminEmails();

  for (const email of adminEmails) {
    try {
      const client = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        return true;
      }
    } catch {
      // Keep trying the remaining admins rather than letting one bad attempt fail
      // the whole check.
    }
  }

  return false;
}
