"use client";

import { useRealtimeProgramJudges } from "@/hooks/useRealtimeProgramJudges";

/** Renders nothing — just mounts the Realtime subscription. Drop this alongside any
 * judge-facing display whose program list depends on program_judges (a judge being
 * assigned/unassigned should show up without a manual refresh). */
export function RealtimeProgramJudgesListener() {
  useRealtimeProgramJudges();
  return null;
}
