"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Same pattern as useRealtimePrograms — subscribes to `judge_scores` and calls
 * router.refresh() on any change. Needed so the Fixture page's roster ("performing now"
 * vs. "done" vs. "upcoming") updates live as judges submit scores, on any device,
 * without a program status change (which useRealtimePrograms alone wouldn't catch mid-
 * program, since the status only flips once ALL students are fully scored).
 */
export function useRealtimeJudgeScores() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("judge-scores-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "judge_scores" },
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
