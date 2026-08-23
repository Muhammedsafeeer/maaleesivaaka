"use server";

import { revalidatePath } from "next/cache";
import {
  startNextFixtureEntry,
  overrideProgramStatus,
  reorderUpcoming,
  createFixtureBreak,
  overrideBreakStatus,
  deleteFixtureBreak,
  searchPrograms,
  type FixtureEntryRef,
  type ProgramSearchResult,
} from "@/lib/services/fixture.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { StageType, ProgramStatus } from "@/constants/programs";
import type { FixtureBreakStatus } from "@/types/program";

export type FixtureActionResult = { error: string } | { error?: undefined };

export async function startNextProgramAction(
  stageType: StageType,
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await startNextFixtureEntry(stageType);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  revalidatePath("/admin/programs");
  revalidatePath("/audience");
  return {};
}

export async function setProgramStatusAction(
  programId: string,
  status: Exclude<ProgramStatus, "published">,
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await overrideProgramStatus(programId, status);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/admin");
  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/audience");
  return {};
}

export async function reorderUpcomingAction(
  stageType: StageType,
  orderedEntries: FixtureEntryRef[],
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await reorderUpcoming(stageType, orderedEntries);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  revalidatePath("/admin/programs");
  return {};
}

export async function createFixtureBreakAction(
  stageType: StageType,
  label: string,
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await createFixtureBreak(stageType, label);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  return {};
}

export async function setBreakStatusAction(
  breakId: string,
  status: FixtureBreakStatus,
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await overrideBreakStatus(breakId, status);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  revalidatePath("/admin/programs");
  revalidatePath("/audience");
  return {};
}

export async function deleteFixtureBreakAction(breakId: string): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteFixtureBreak(breakId);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  return {};
}

/**
 * Fixture page's "find a program" search — global across both stages (see
 * fixture.service.ts's searchPrograms). Read-only, but still admin-gated like every
 * other action here rather than left open to any authenticated session.
 */
export async function searchProgramsAction(query: string): Promise<ProgramSearchResult[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];

  return searchPrograms(query);
}
