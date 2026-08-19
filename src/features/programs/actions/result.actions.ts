"use server";

import { revalidatePath } from "next/cache";
import { finalizeIfComplete, publishProgram } from "@/lib/services/result.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type ResultActionResult = { error: string } | { error?: undefined };

/**
 * D-014's admin-side fallback: the automatic trigger in submitScoresAction should
 * normally already have done this, but this exists in case that call silently failed
 * with nothing left to re-trigger it.
 */
export async function recalculateResultsAction(programId: string): Promise<ResultActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await finalizeIfComplete(programId);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/admin");
  return {};
}

export async function publishProgramAction(programId: string): Promise<ResultActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await publishProgram(programId);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/admin/programs");
  revalidatePath("/admin/fixture");
  revalidatePath("/audience");
  return {};
}
