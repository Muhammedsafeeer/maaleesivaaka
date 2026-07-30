"use server";

import { revalidatePath } from "next/cache";
import { submitScoresSchema, type SubmitScoresInput } from "@/features/scoring/validation/score.schema";
import { submitScores } from "@/lib/services/scoring.service";
import { finalizeIfComplete } from "@/lib/services/result.service";
import { assertJudge } from "@/lib/services/auth.service";

export type ScoringActionResult = { error: string } | { error?: undefined };

export async function submitScoresAction(
  programId: string,
  input: SubmitScoresInput,
): Promise<ScoringActionResult> {
  const auth = await assertJudge();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await submitScores(programId, parsed.data.scores);
  if (!result.success) return { error: result.error };

  // D-003: check whether this submission was the one that completed the program, and
  // if so calculate + write results. Best-effort — the score itself already saved
  // successfully, which is the operation the judge actually asked for, so a
  // finalization failure here doesn't fail their submission. It's not a silent dead
  // end either: the admin-side "Recalculate" action (D-014) can retry it.
  const finalizeResult = await finalizeIfComplete(programId);
  if (!finalizeResult.success) {
    console.error("finalizeIfComplete failed after score submission:", finalizeResult.error);
  }

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  revalidatePath(`/admin/programs/${programId}`);
  return {};
}
