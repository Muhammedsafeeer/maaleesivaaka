"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JUDGE_PRESENCE_CHANNEL, type JudgePresencePayload } from "@/constants/realtime";

function programIdFromPath(pathname: string): string | null {
  const match = /^\/judge\/programs\/([^/]+)/.exec(pathname);
  return match?.[1] ?? null;
}

/**
 * Tracks this judge on the shared presence channel so the admin dashboard can show
 * who is logged in, and which scoring page they are on, without polling.
 */
export function useJudgePresenceTrack(user: { id: string; name: string; email: string }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(JUDGE_PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;

    function payload(): JudgePresencePayload {
      return {
        judgeId: user.id,
        name: user.name,
        email: user.email,
        programId: programIdFromPath(pathnameRef.current),
        onlineAt: new Date().toISOString(),
      };
    }

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(payload());
      }
    });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [user.id, user.name, user.email]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    void channel.track({
      judgeId: user.id,
      name: user.name,
      email: user.email,
      programId: programIdFromPath(pathname),
      onlineAt: new Date().toISOString(),
    } satisfies JudgePresencePayload);
  }, [pathname, user.email, user.id, user.name]);
}
