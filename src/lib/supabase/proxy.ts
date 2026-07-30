import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase session cookie on every request. This is the
 * only one of the three clients that can both read AND write cookies,
 * which is why session refresh lives here and not in server.ts.
 *
 * Role-based redirects (admin -> /admin, judge -> /judge) are not part
 * of this yet — that's Phase 6/7, once login and RLS exist. For now
 * this only keeps the session alive.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not add logic between createServerClient() and this call. Reading
  // the user is what triggers the token refresh; anything in between
  // runs against a session that may already be stale.
  await supabase.auth.getUser();

  return supabaseResponse;
}
