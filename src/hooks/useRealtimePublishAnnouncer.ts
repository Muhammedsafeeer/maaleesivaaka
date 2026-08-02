"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type ProgramRow = Database["public"]["Tables"]["programs"]["Row"];

/**
 * Audience-only: toasts "<Program> results are out!" the moment a program flips to
 * 'published' while this page is open. RealtimeProgramsListener already
 * router.refresh()es on the same event so the page's own data updates — this is purely
 * the "tell someone watching a shared screen that something just happened" layer on
 * top, since a silent background refresh alone doesn't announce anything.
 *
 * `payload.old.status` (not just checking `payload.new.status === "published"`) is what
 * keeps this from re-firing on an unrelated edit to a program that was already
 * published — needs `alter table programs replica identity full` (see
 * 20260805000000_programs_replica_identity_full.sql) since the default REPLICA IDENTITY
 * only includes the primary key in the old-row payload, not the rest of the columns.
 */
export function useRealtimePublishAnnouncer() {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("publish-announcements")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "programs" },
        (payload) => {
          const next = payload.new as ProgramRow;
          const prev = payload.old as Partial<ProgramRow>;

          if (next.status === "published" && prev.status !== "published") {
            toast.success(`🏆 ${next.name} results are out!`, {
              description: "Check the leaderboard for the latest standings.",
              duration: 8000,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
