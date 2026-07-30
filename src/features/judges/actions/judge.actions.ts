"use server";

import { revalidatePath } from "next/cache";
import { editJudgeSchema, type EditJudgeInput } from "@/features/judges/validation/judge.schema";
import { updateJudgeName } from "@/lib/services/judge.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type JudgeActionResult = { error: string } | { error?: undefined };

export async function updateJudgeAction(
  id: string,
  input: EditJudgeInput,
): Promise<JudgeActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = editJudgeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateJudgeName(id, parsed.data.name);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/judges");
  return {};
}
