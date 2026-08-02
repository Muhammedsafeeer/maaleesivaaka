"use client";

import { useRealtimePublishAnnouncer } from "@/hooks/useRealtimePublishAnnouncer";

/** Renders nothing — just mounts the "results published" toast subscription. Drop this
 * on the audience page only; admin/judge already see a program's status change directly
 * in their own UI and don't need a separate announcement for it. */
export function RealtimePublishAnnouncer() {
  useRealtimePublishAnnouncer();
  return null;
}
