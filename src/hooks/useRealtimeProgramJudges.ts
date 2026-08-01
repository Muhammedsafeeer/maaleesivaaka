"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to `program_judges` and calls router.refresh() on any change — a judge
 * being assigned to or unassigned from a program is an insert/delete on this table, not
 * `programs` itself, so useRealtimePrograms alone doesn't catch it. RLS ("judges can
 * read their own assignment rows") scopes this to the signed-in judge's own rows, same
 * as a normal SELECT.
 */
export function useRealtimeProgramJudges() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("program-judges-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "program_judges" },
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
