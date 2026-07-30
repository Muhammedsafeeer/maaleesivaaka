import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components. Reads the session from
 * document.cookie. Safe to call on every render — createBrowserClient
 * reuses a single underlying instance internally.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
