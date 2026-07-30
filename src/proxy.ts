import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Named "proxy" (not "middleware") per Next.js 16's renamed file
// convention — see docs/decisions.md D-009.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
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
