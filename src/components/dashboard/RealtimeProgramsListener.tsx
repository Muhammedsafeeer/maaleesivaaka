"use client";

import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";

/** Renders nothing — just mounts the Realtime subscription (Phase 17) inside a Server
 * Component page. Same shape as RealtimeLeaderboardListener: drop this alongside any
 * program status/details display that should live-update (a status change, a fixture
 * auto-advance, or an admin edit elsewhere shouldn't need a manual refresh to show up). */
export function RealtimeProgramsListener() {
  useRealtimePrograms();
  return null;
}
