/** Shared shapes for admin program roster judge-score display (no server imports). */

export type ProgramJudgeScoreBoard = {
  judges: { id: string; label: string }[];
  studentScores: Record<string, Record<string, number>>;
  teamScores: Record<string, Record<string, number>>;
};

/** e.g. `J1:10, J2:5` — missing scores show as `—`. */
export function formatParticipantJudgeScores(
  judges: ProgramJudgeScoreBoard["judges"],
  scores: Record<string, number> | undefined,
): string {
  if (judges.length === 0) return "";
  return judges.map((judge) => `${judge.label}:${scores?.[judge.id] ?? "—"}`).join(", ");
}
