"use server";

import { revalidatePath } from "next/cache";
import {
  submitScoresSchema,
  submitTeamScoresSchema,
  type SubmitScoresInput,
  type SubmitTeamScoresInput,
} from "@/features/scoring/validation/score.schema";
import {
  submitScores,
  submitTeamScores,
  ADMIN_OVERRIDE_REQUIRED,
  type AdminOverride,
} from "@/lib/services/scoring.service";
import { finalizeIfComplete } from "@/lib/services/result.service";
import { assertJudge } from "@/lib/services/auth.service";

export type ScoringActionResult =
  | { error: string; requiresAdminOverride?: boolean }
  | { error?: undefined };

export async function submitScoresAction(
  programId: string,
  input: SubmitScoresInput,
  adminOverride?: AdminOverride,
): Promise<ScoringActionResult> {
  const auth = await assertJudge();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await submitScores(programId, parsed.data.scores, adminOverride);
  if (!result.success) {
    if (result.error === ADMIN_OVERRIDE_REQUIRED) {
      return {
        error: adminOverride
          ? "Incorrect admin password."
          : "This changes an already-submitted score — an admin must authorize the change.",
        requiresAdminOverride: true,
      };
    }
    return { error: result.error };
  }

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
  // A revision that broke (or created) a tie changes what the dashboard's "needs a
  // decision" panel shows — keep it in sync with whatever finalizeIfComplete just did.
  revalidatePath("/admin");
  return {};
}

/** Team-scoped sibling of submitScoresAction (D-025 follow-up) — same shape, calls
 * submitTeamScores instead. Finalization/revalidation afterward is participation-type-
 * agnostic, so that part is identical to submitScoresAction's. */
export async function submitTeamScoresAction(
  programId: string,
  input: SubmitTeamScoresInput,
  adminOverride?: AdminOverride,
): Promise<ScoringActionResult> {
  const auth = await assertJudge();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitTeamScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await submitTeamScores(programId, parsed.data.scores, adminOverride);
  if (!result.success) {
    if (result.error === ADMIN_OVERRIDE_REQUIRED) {
      return {
        error: adminOverride
          ? "Incorrect admin password."
          : "This changes an already-submitted score — an admin must authorize the change.",
        requiresAdminOverride: true,
      };
    }
    return { error: result.error };
  }

  const finalizeResult = await finalizeIfComplete(programId);
  if (!finalizeResult.success) {
    console.error("finalizeIfComplete failed after team score submission:", finalizeResult.error);
  }

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  revalidatePath(`/admin/programs/${programId}`);
  // A revision that broke (or created) a tie changes what the dashboard's "needs a
  // decision" panel shows — keep it in sync with whatever finalizeIfComplete just did.
  revalidatePath("/admin");
  return {};
}
