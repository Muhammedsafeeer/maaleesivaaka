import { createClient } from "@/lib/supabase/server";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type ScoringCriterion = { id: string; name: string };

/** A program's configured scoring types, in display order. Empty means the program
 * uses a single implicit 0–10 score (see constants/scoring.ts). */
export async function listScoringCriteria(programId: string): Promise<ScoringCriterion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scoring_criteria")
    .select("id, name")
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listScoringCriteria failed:", error.message);
    return [];
  }

  return data;
}

/**
 * Whether any judge has already submitted a score for this program. This, not program
 * status, is the real invariant behind locking scoring types: fixture.service.ts's
 * overrideProgramStatus() is an admin escape hatch that can revert a program's status
 * from 'scoring' back to 'draft'/'upcoming' (e.g. "started by mistake") without
 * touching judge_scores — a status-only lock would let that reopen the editor on a
 * program that already has scores.
 */
export async function hasSubmittedScores(programId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("judge_scores")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);

  if (error) {
    console.error("hasSubmittedScores failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

/**
 * Replaces a program's full set of scoring types with `names`, in order
 * (delete-all-then-insert, matching the admin dialog's "edit the whole list, save"
 * UX rather than diffing individual add/remove operations).
 *
 * Refuses once a judge has scored the program — changing the rubric out from under
 * scores that were computed against the old one would silently corrupt them. The
 * dialog already disables this section in the UI once that's true; this is the
 * re-check for a direct Server Action call, same pattern as submitScores' program
 * status check.
 */
export async function replaceScoringCriteria(
  programId: string,
  names: string[],
): Promise<ServiceResult<null>> {
  if (await hasSubmittedScores(programId)) {
    return {
      success: false,
      error: "Scoring types can't be changed after scores have been submitted.",
    };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("scoring_criteria")
    .delete()
    .eq("program_id", programId);

  if (deleteError) {
    return { success: false, error: "Could not update scoring types. Please try again." };
  }

  if (names.length === 0) {
    return { success: true, data: null };
  }

  const { error: insertError } = await supabase.from("scoring_criteria").insert(
    names.map((name, index) => ({
      program_id: programId,
      name,
      sort_order: index,
    })),
  );

  if (insertError) {
    return { success: false, error: "Could not update scoring types. Please try again." };
  }

  return { success: true, data: null };
}
