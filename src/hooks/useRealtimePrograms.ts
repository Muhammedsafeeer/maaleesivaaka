"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Same pattern as useRealtimeLeaderboard (Phase 15): subscribes to the `programs`
 * table directly and calls router.refresh() on any change. Needed on the Fixture page
 * because a program's status can flip (auto-advance to the next serial number) from a
 * judge's submission on a completely different device.
 */
export function useRealtimePrograms() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("programs-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "programs" },
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
