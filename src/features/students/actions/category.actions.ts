"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type CategoryActionResult = { error: string } | { error?: undefined };

export async function createCategoryAction(input: {
  value: string;
  label: string;
  malayalamLabel?: string;
}): Promise<CategoryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!input.label.trim()) return { error: "Label is required." };
  if (!input.value.trim()) return { error: "Value is required." };

  const result = await createCategory(input);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  revalidatePath("/admin/programs");
  return {};
}

export async function updateCategoryAction(
  id: string,
  input: { label: string; malayalamLabel?: string },
): Promise<CategoryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!input.label.trim()) return { error: "Label is required." };

  const result = await updateCategory(id, input);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  revalidatePath("/admin/programs");
  return {};
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteCategory(id);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  revalidatePath("/admin/programs");
  return {};
}
