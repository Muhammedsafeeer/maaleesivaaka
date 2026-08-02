"use client";

import { useRealtimeJudgeScores } from "@/hooks/useRealtimeJudgeScores";

/** Renders nothing — just mounts the Realtime subscription. Drop this alongside any
 * display whose data depends on live scoring progress (e.g. the Fixture page's
 * per-student "performing now" roster). */
export function RealtimeJudgeScoresListener() {
  useRealtimeJudgeScores();
  return null;
}
