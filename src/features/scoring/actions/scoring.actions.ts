"use server";

import { revalidatePath } from "next/cache";
import { submitScoresSchema, type SubmitScoresInput } from "@/features/scoring/validation/score.schema";
import { submitScores } from "@/lib/services/scoring.service";
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

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  return {};
}
