import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { PROTECTED_PREFIXES, ROLE_HOME, LOGIN_ROUTE, type Role } from "@/constants/roles";

/**
 * Redirects to `path`, carrying forward the refreshed session cookies from
 * `sessionResponse` — a fresh NextResponse.redirect() on its own would silently drop a
 * token refresh that just happened in updateSession(), on exactly the requests where a
 * redirect fires.
 */
function redirectPreservingSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  path: string,
) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

// Named "proxy" (not "middleware") per Next.js 16's renamed file
// convention — see docs/decisions.md D-009.
//
// This is gate #1 of three (see docs/decisions.md and src/app/README.md):
// proxy -> page-level server check (admin/judge layouts) -> RLS. A bug or bypass here
// must never be the only thing standing between a request and protected data — the
// other two gates re-check independently.
export async function proxy(request: NextRequest) {
  const { response, role } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const protectedEntry = Object.entries(PROTECTED_PREFIXES).find(([prefix]) =>
    pathname.startsWith(prefix),
  ) as [string, Role] | undefined;

  if (protectedEntry) {
    const [, requiredRole] = protectedEntry;

    if (!role) {
      // Not signed in (or, per getCurrentUser()'s contract, no profile row for an
      // otherwise-authenticated user) — treat both the same and send to /login.
      return redirectPreservingSession(request, response, LOGIN_ROUTE);
    }

    if (role !== requiredRole) {
      // Signed in, but this isn't their area. Send them to their own home rather than
      // a 403 for a route they were never going to use.
      return redirectPreservingSession(request, response, ROLE_HOME[role]);
    }

    return response;
  }

  if (pathname === LOGIN_ROUTE && role) {
    // Already signed in — skip the login page entirely.
    return redirectPreservingSession(request, response, ROLE_HOME[role]);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, so the session cookie
     * stays fresh on navigations without paying the cost on every image
     * or font request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
