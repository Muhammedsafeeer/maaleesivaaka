"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * D-002 consequence #3: Postgres views (group_leaderboard) don't emit Realtime events,
 * so this subscribes to the underlying `results` TABLE instead and calls
 * router.refresh() when a row changes. Next.js re-runs the Server Component fetch —
 * no client-side copy of the leaderboard is ever kept (D-016).
 */
export function useRealtimeLeaderboard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("results-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
}
