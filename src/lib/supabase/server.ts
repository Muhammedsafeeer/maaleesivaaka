import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and route
 * handlers. Must be created fresh on every call — never hoisted to a
 * module-level variable, or one request's cookies (and therefore one
 * user's session) would leak into another request handled by the same
 * server process.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // Harmless as long as middleware.ts is refreshing the session
            // on every request — see src/middleware.ts.
          }
        },
      },
    },
  );
}
