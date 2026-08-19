"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Same pattern as useRealtimePrograms/useRealtimeLeaderboard (D-016) — subscribes to
 * `ads` and `ad_media` directly and calls router.refresh() on any change. Without this,
 * /tv (and /audience) only pick up an admin's "Push to TV" toggle, a reorder, or a new
 * media upload on their next natural navigation — an unattended TV display never
 * navigates on its own, so it would need a manual refresh. Two `.on()` calls on one
 * channel, both registered before the single `.subscribe()` — not two channels, and not
 * a second `.on()` after subscribing (that throws, see admin/layout.tsx's own comment
 * on useRealtimeLeaderboard for the exact error).
 */
export function useRealtimeAds() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("ads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ads" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_media" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
}
