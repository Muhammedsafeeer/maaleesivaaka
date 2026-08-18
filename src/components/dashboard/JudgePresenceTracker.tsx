"use client";

import { useJudgePresenceTrack } from "@/hooks/useJudgePresenceTrack";

/** Renders nothing — mounts presence tracking inside the judge layout so every judge
 * page (dashboard and per-program scoring) reports the same live session. */
export function JudgePresenceTracker({
  user,
}: {
  user: { id: string; name: string; email: string };
}) {
  useJudgePresenceTrack(user);
  return null;
}
