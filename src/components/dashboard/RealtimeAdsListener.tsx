"use client";

import { useRealtimeAds } from "@/hooks/useRealtimeAds";

/** Renders nothing — just mounts the Realtime subscription. Same shape as
 * RealtimeLeaderboardListener/RealtimeProgramsListener: drop this on any page whose ad
 * slots/TV rotation should update live when an admin edits, reorders, or pushes/removes
 * an ad, without anyone needing to manually refresh. */
export function RealtimeAdsListener() {
  useRealtimeAds();
  return null;
}
