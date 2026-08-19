"use server";

import { revalidatePath } from "next/cache";
import {
  startNextProgram,
  overrideProgramStatus,
  reorderUpcoming,
} from "@/lib/services/fixture.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { StageType, ProgramStatus } from "@/constants/programs";

export type FixtureActionResult = { error: string } | { error?: undefined };

export async function startNextProgramAction(
  stageType: StageType,
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await startNextProgram(stageType);
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
  orderedIds: string[],
): Promise<FixtureActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await reorderUpcoming(stageType, orderedIds);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/fixture");
  revalidatePath("/admin/programs");
  return {};
}
