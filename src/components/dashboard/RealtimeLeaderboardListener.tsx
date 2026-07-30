"use client";

import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";

/** Renders nothing — just mounts the Realtime subscription (Phase 15) inside a Server
 * Component page. Drop this alongside any leaderboard display that should live-update. */
export function RealtimeLeaderboardListener() {
  useRealtimeLeaderboard();
  return null;
}
