import { createClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/types/category";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/** All categories, sorted by sort_order — the replacement for the CATEGORIES constant. */
export async function listCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as ReturnType<typeof createClient> extends Promise<infer S> ? S : never)
    .from("categories" as "students") // type workaround — table exists at runtime
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listCategories failed:", error.message);
    return [];
  }

  return (data ?? []) as unknown as CategoryRow[];
}

export async function createCategory(input: {
  value: string;
  label: string;
  malayalamLabel?: string;
}): Promise<ServiceResult<CategoryRow>> {
  const supabase = await createClient();
  const maxOrder = await getMaxSortOrder();
  const slug = input.value.trim().toLowerCase().replace(/\s+/g, "_");

  const { data, error } = await (supabase as any)
    .from("categories")
    .insert({
      value: slug,
      label: input.label.trim(),
      malayalam_label: input.malayalamLabel?.trim() || null,
      sort_order: maxOrder + 1,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A category with that value already exists." };
    }
    return { success: false, error: "Could not create the category. Please try again." };
  }

  return { success: true, data: data as CategoryRow };
}

export async function updateCategory(
  id: string,
  input: { label: string; malayalamLabel?: string },
): Promise<ServiceResult<CategoryRow>> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("categories")
    .update({
      label: input.label.trim(),
      malayalam_label: input.malayalamLabel?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the category. Please try again." };
  }

  return { success: true, data: data as CategoryRow };
}

export async function deleteCategory(id: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  // Look up the value to check usage
  const { data: cat } = await (supabase as any)
    .from("categories")
    .select("value")
    .eq("id", id)
    .single();

  if (!cat) {
    return { success: false, error: "Category not found." };
  }

  // Cannot delete if students or programs reference this value
  const { count: studentCount } = await supabase
    .from("student_categories")
    .select("*", { count: "exact", head: true })
    .eq("category", cat.value);

  if (studentCount && studentCount > 0) {
    return {
      success: false,
      error: "This category is still used by students and can't be deleted.",
    };
  }

  const { count: programCount } = await supabase
    .from("programs")
    .select("*", { count: "exact", head: true })
    .eq("category", cat.value);

  if (programCount && programCount > 0) {
    return {
      success: false,
      error: "This category is still used by programs and can't be deleted.",
    };
  }

  const { error } = await (supabase as any).from("categories").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Could not delete the category. Please try again." };
  }

  return { success: true, data: null };
}

async function getMaxSortOrder(): Promise<number> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  return data?.sort_order ?? 0;
}
