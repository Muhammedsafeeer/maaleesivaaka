"use server";

import { revalidatePath } from "next/cache";
import { programSchema, type ProgramInput } from "@/features/programs/validation/program.schema";
import {
  createProgram,
  updateProgram,
  deleteProgram,
} from "@/lib/services/program.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type ProgramActionResult = { error: string } | { error?: undefined };

export async function createProgramAction(
  input: ProgramInput,
): Promise<ProgramActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = programSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createProgram(parsed.data);
  if (!result.success) return { error: result.error };

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

  const result = await updateProgram(id, parsed.data);
  if (!result.success) return { error: result.error };

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
