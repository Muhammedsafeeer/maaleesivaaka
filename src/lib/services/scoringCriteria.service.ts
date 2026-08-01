import { createClient } from "@/lib/supabase/server";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

<<<<<<< HEAD
export type ScoringCriterion = {
  id: string;
  name: string;
};

/** A program's named scoring types, in the order the admin arranged them. Empty means
 * the program uses a single implicit 0-10 score (constants/scoring.ts's fallback). */
=======
export type ScoringCriterion = { id: string; name: string };

/** A program's configured scoring types, in display order. Empty means the program
 * uses a single implicit 0–10 score (see constants/scoring.ts). */
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
export async function listScoringCriteria(programId: string): Promise<ScoringCriterion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scoring_criteria")
    .select("id, name")
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });

  if (error) {
<<<<<<< HEAD
    console.error("listScoringCriteria failed:", error.message);
=======
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
    return [];
  }

  return data;
}

<<<<<<< HEAD
/**
 * Whether any judge has already submitted a score for this program. This, not program
 * status, is the real invariant behind locking scoring types: fixture.service.ts's
 * overrideProgramStatus() is an admin escape hatch that can revert a program's status
 * from 'scoring' back to 'draft'/'upcoming' (e.g. "started by mistake") without
 * touching judge_scores — a status-only lock would let that reopen the editor on a
 * program that already has scores, and a delete-then-reinsert would orphan those
 * scores' criterion_id references (fresh UUIDs each time) out from under them.
 */
export async function hasSubmittedScores(programId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
=======
/** Whether any judge has submitted a score for this program yet — the lock that
 * program.actions.ts checks before letting the admin touch this program's roster of
 * scoring types, and that replaceScoringCriteria re-checks itself below. */
export async function hasSubmittedScores(programId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
    .from("judge_scores")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);

<<<<<<< HEAD
=======
  if (error) {
    return true;
  }

>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
  return (count ?? 0) > 0;
}

/**
<<<<<<< HEAD
 * Replaces a program's whole scoring-type list at once (delete-all-then-insert-in-order)
 * — matches the ProgramFormDialog UX of editing the full list and saving, rather than
 * diffing individual add/remove operations.
 *
 * Locked once any judge has scored this program (see hasSubmittedScores). The dialog
 * already disables this section in the UI once that's true — this is the re-check for
 * a direct Server Action call, same pattern as submitScores' program status check.
=======
 * Replaces a program's full set of scoring types with `names`, in order. Refuses once
 * a judge has scored the program — changing the rubric out from under scores that were
 * computed against the old one would silently corrupt them.
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
 */
export async function replaceScoringCriteria(
  programId: string,
  names: string[],
<<<<<<< HEAD
): Promise<ServiceResult<ScoringCriterion[]>> {
  const supabase = await createClient();

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id")
    .eq("id", programId)
    .single();

  if (programError || !program) {
    return { success: false, error: "Program not found." };
  }

  if (await hasSubmittedScores(programId)) {
    return {
      success: false,
      error: "Scoring types are locked — judges have already submitted scores for this program.",
    };
  }

=======
): Promise<ServiceResult<null>> {
  if (await hasSubmittedScores(programId)) {
    return {
      success: false,
      error: "Scoring types can't be changed after scores have been submitted.",
    };
  }

  const supabase = await createClient();

>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
  const { error: deleteError } = await supabase
    .from("scoring_criteria")
    .delete()
    .eq("program_id", programId);

  if (deleteError) {
<<<<<<< HEAD
    return { success: false, error: "Could not save scoring types. Please try again." };
  }

  if (names.length === 0) {
    return { success: true, data: [] };
  }

  const rows = names.map((name, index) => ({
    program_id: programId,
    name,
    sort_order: index,
  }));

  const { data, error: insertError } = await supabase
    .from("scoring_criteria")
    .insert(rows)
    .select("id, name");

  if (insertError) {
    return { success: false, error: "Could not save scoring types. Please try again." };
  }

  return { success: true, data };
=======
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
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
}
