import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

export type ProxySession = {
  /** Carries the refreshed session cookies. Redirect responses must copy these onto
   *  themselves (see src/proxy.ts) or a token refresh that just happened is silently
   *  dropped on exactly the requests where a redirect fires. */
  response: NextResponse;
  role: Database["public"]["Enums"]["user_role"] | null;
};

/**
 * Refreshes the Supabase session cookie on every request. This is the
 * only one of the three clients that can both read AND write cookies,
 * which is why session refresh lives here and not in server.ts.
 *
 * Also reads the caller's role, for the route-protection decision in
 * src/proxy.ts. This deliberately does NOT reuse
 * lib/services/auth.service.ts's getCurrentUser() — that function goes
 * through lib/supabase/server.ts, which reads cookies via next/headers, an
 * API that isn't available inside the proxy/middleware runtime. The Supabase
 * client here uses request.cookies instead, so the role lookup has to use
 * this same client, not a second one built the Server Component way.
 */
export async function updateSession(request: NextRequest): Promise<ProxySession> {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: supabaseResponse, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { response: supabaseResponse, role: profile?.role ?? null };
}
