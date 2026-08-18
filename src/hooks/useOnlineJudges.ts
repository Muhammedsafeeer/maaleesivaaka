"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { JUDGE_PRESENCE_CHANNEL, type JudgePresencePayload } from "@/constants/realtime";

function isPayload(value: unknown): value is JudgePresencePayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.judgeId === "string" &&
    typeof row.name === "string" &&
    typeof row.email === "string" &&
    (row.programId === null || typeof row.programId === "string") &&
    typeof row.onlineAt === "string"
  );
}

/**
 * Admin-side subscriber for the judge presence channel. Presence is ephemeral (no
 * table) — this is the only way to know who is logged in right now.
 */
export function useOnlineJudges() {
  const [online, setOnline] = useState<JudgePresencePayload[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(JUDGE_PRESENCE_CHANNEL);

    function sync() {
      const state = channel.presenceState();
      const byId = new Map<string, JudgePresencePayload>();

      for (const presences of Object.values(state)) {
        for (const entry of presences) {
          if (!isPayload(entry)) continue;
          const existing = byId.get(entry.judgeId);
          if (!existing || existing.onlineAt < entry.onlineAt) {
            byId.set(entry.judgeId, entry);
          }
        }
      }

      setOnline([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
    }

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return online;
}
