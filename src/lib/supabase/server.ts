import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Server Components, Server Actions, and route
 * handlers. Must be created fresh on every call — never hoisted to a
 * module-level variable, or one request's cookies (and therefore one
 * user's session) would leak into another request handled by the same
 * server process.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, which can't write cookies.
            // Harmless as long as proxy.ts is refreshing the session on
            // every request — see src/proxy.ts.
          }
        },
      },
    },
  );
}

/**
 * A genuinely anonymous Supabase client — never reads the request's session cookie,
 * so RLS always applies as an unauthenticated caller regardless of who's actually
 * browsing. `/audience`, `/tv`, and `/g/[id]` are all deliberately public routes
 * (constants/roles.ts's PUBLIC_ROUTES) meant to show only published data to ANYONE —
 * but the plain createClient() above binds to whatever session cookie the browser
 * happens to be carrying, so a staff member who's simply logged in as admin/judge on
 * that same browser (a very ordinary way to preview these pages) would silently see
 * admin-level RLS access instead of the public, published-only slice — completed-but-
 * not-yet-published results leaking onto a screen meant to be public. Query functions
 * exclusively backing those three routes use this instead of createClient() so what
 * they show never depends on who's viewing.
 */
export function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
