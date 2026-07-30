import { createClient } from "@/lib/supabase/server";
import { rankResults, type StudentAverage } from "@/lib/services/scoring.service";
import type { Database } from "@/types/database.types";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type Result = Database["public"]["Tables"]["results"]["Row"];

/**
 * D-003: if every assigned judge has now scored every assigned student, calculate and
 * write results, and flip the program to 'completed'. A no-op (success, no write) if
 * scoring isn't complete yet. Called from the scoring Server Action right after a
 * submission (D-014) — also safe to call again later as an admin-side "Recalculate"
 * fallback, since finalize_program_results is idempotent.
 */
export async function finalizeIfComplete(programId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { data: isComplete, error: checkError } = await supabase.rpc(
    "is_program_fully_scored",
    { p_program_id: programId },
  );

  if (checkError) {
    return { success: false, error: "Could not check scoring progress. Please try again." };
  }

  if (!isComplete) {
    return { success: true, data: null };
  }

  const { data: scores, error: scoresError } = await supabase.rpc("get_program_scores", {
    p_program_id: programId,
  });

  if (scoresError || !scores || scores.length === 0) {
    return { success: false, error: "Could not read scores to calculate results." };
  }

  const totalsByStudent = new Map<string, { sum: number; count: number }>();
  for (const row of scores) {
    const entry = totalsByStudent.get(row.student_id) ?? { sum: 0, count: 0 };
    entry.sum += row.score;
    entry.count += 1;
    totalsByStudent.set(row.student_id, entry);
  }

  const averages: StudentAverage[] = Array.from(totalsByStudent.entries()).map(
    ([student_id, { sum, count }]) => ({
      student_id,
      average_score: Math.round((sum / count) * 100) / 100,
    }),
  );

  const ranked = rankResults(averages);

  const { error: finalizeError } = await supabase.rpc("finalize_program_results", {
    p_program_id: programId,
    p_results: ranked,
  });

  if (finalizeError) {
    return { success: false, error: "Could not save calculated results. Please try again." };
  }

  return { success: true, data: null };
}

/** Results for a program, joined with the student's name for the admin review table. */
export async function listResults(programId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select("*, students(name, roll_number)")
    .eq("program_id", programId)
    .order("position", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}

/** D-003's manual gate: admin reviews the calculated results, then publishes. */
export async function publishProgram(programId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({ status: "published" })
    .eq("id", programId)
    .eq("status", "completed")
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: "Could not publish results — results may not be calculated for this program yet.",
    };
  }

  return { success: true, data: null };
}
