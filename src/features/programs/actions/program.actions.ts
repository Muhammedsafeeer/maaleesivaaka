"use server";

import { revalidatePath } from "next/cache";
import {
  programSchema,
  createProgramSchema,
  type ProgramInput,
  type CreateProgramInput,
} from "@/features/programs/validation/program.schema";
import {
  createProgram,
  updateProgram,
  deleteProgram,
  convertProgramToGroup,
} from "@/lib/services/program.service";
import {
  listScoringCriteria,
  replaceScoringCriteria,
  hasSubmittedScores,
  type ScoringCriterion,
} from "@/lib/services/scoringCriteria.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type ProgramActionResult = { error: string } | { error?: undefined };

export async function createProgramAction(
  input: CreateProgramInput,
): Promise<ProgramActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = createProgramSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { criteriaNames, ...programInput } = parsed.data;
  const result = await createProgram(programInput);
  if (!result.success) return { error: result.error };

  // Best-effort secondary step, same shape as finalizeIfComplete after a score
  // submission — the program itself already saved, which is the primary thing the
  // admin asked for.
  const criteriaResult = await replaceScoringCriteria(
    result.data.id,
    criteriaNames.map((c) => c.name),
  );
  if (!criteriaResult.success) {
    console.error("replaceScoringCriteria failed after program creation:", criteriaResult.error);
  }

  revalidatePath("/admin/programs");
  return {};
}

export async function updateProgramAction(
  id: string,
  input: ProgramInput,
): Promise<ProgramActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = programSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { criteriaNames, ...programInput } = parsed.data;
  const result = await updateProgram(id, programInput);
  if (!result.success) return { error: result.error };

  // Only attempt this once no judge has scored the program yet — the dialog already
  // renders the section read-only past that point and resubmits the same unchanged
  // list, so skipping here (rather than calling replaceScoringCriteria and hitting its
  // lock guard) avoids turning an unrelated edit, like the name, into a false error.
  // Keyed off actual scores, not status: fixture.service.ts's overrideProgramStatus can
  // revert status to draft/upcoming without touching judge_scores.
  if (!(await hasSubmittedScores(id))) {
    const criteriaResult = await replaceScoringCriteria(
      id,
      criteriaNames.map((c) => c.name),
    );
    if (!criteriaResult.success) {
      return { error: criteriaResult.error };
    }
  }

  revalidatePath("/admin/programs");
  return {};
}

export async function getScoringCriteriaAction(
  programId: string,
): Promise<{ data: ScoringCriterion[]; locked: boolean }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { data: [], locked: true };

  const [data, locked] = await Promise.all([
    listScoringCriteria(programId),
    hasSubmittedScores(programId),
  ]);

  return { data, locked };
}

export async function convertProgramToGroupAction(id: string): Promise<ProgramActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  // Same lock as scoring types (hasSubmittedScores, not status — see its own comment):
  // rewriting the roster model out from under scores that were recorded against the
  // old individual one would corrupt them.
  if (await hasSubmittedScores(id)) {
    return { error: "Can't convert after judges have started scoring this program." };
  }

  const result = await convertProgramToGroup(id);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${id}`);
  revalidatePath("/admin/programs");
  return {};
}

export async function deleteProgramAction(id: string): Promise<ProgramActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteProgram(id);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/programs");
  return {};
}
