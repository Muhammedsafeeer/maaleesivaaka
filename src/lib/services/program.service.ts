import { createClient } from "@/lib/supabase/server";
import type { Program } from "@/types/program";
import {
  CATEGORIES,
  type Category,
  type StageType,
  type ProgramStatus,
  type ParticipationType,
} from "@/constants/programs";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type ProgramFilters = {
  q?: string;
  status?: ProgramStatus;
};

export async function listPrograms(filters: ProgramFilters = {}): Promise<Program[]> {
  const supabase = await createClient();
  let query = supabase.from("programs").select("*").order("name", { ascending: true });

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    // D-015: without this, a real query/RLS failure here looks identical to "no
    // programs match" to every caller (audience "Now Performing", admin list, ...) —
    // logged so it's diagnosable from server logs instead of a silent empty result.
    console.error("listPrograms failed:", error.message);
    return [];
  }

  return data;
}

export type CategoryStatus = {
  category: Category;
  declared: number;
  total: number;
};

/**
 * Audience "Status of Festival" widget (Phase 17): declared (published) vs. total
 * programs, per category. Excludes 'draft' programs from `total` — a draft is admin
 * setup-in-progress, not a real commitment yet, so it shouldn't dent the audience-facing
 * completion picture. Computed in JS from `listPrograms({})` rather than a new SQL
 * view/RPC — the dataset is one school's programs, small enough that a single-pass
 * reduce is simpler and more honest than adding DB machinery for it.
 */
export async function listCategoryStatus(): Promise<CategoryStatus[]> {
  const programs = await listPrograms({});
  const scheduled = programs.filter((p) => p.status !== "draft");

  return CATEGORIES.map(({ value: category }) => {
    const inCategory = scheduled.filter((p) => p.category === category);
    return {
      category,
      declared: inCategory.filter((p) => p.status === "published").length,
      total: inCategory.length,
    };
  });
}

export async function getProgram(id: string): Promise<Program | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select("*").eq("id", id).single();

  if (error) {
    return null;
  }

  return data;
}

/** No `status` here — Phase 17 made status fully system-managed (see program.schema.ts). */
export type ProgramInput = {
  name: string;
  malayalamName?: string;
  stage_type: StageType;
  category: Category;
  /** Raw form string (empty = no limit), same shape as the schema field — converted to
   * a number or null right where it's written (createProgram/updateProgram below). */
  maxTeamSize?: string;
  hideResults?: boolean;
};

/** Set at creation (D-025); updateProgram never touches it — the only path to change
 * it afterwards is convertProgramToGroup below. */
export type CreateProgramInput = ProgramInput & {
  participation_type: ParticipationType;
};

export async function createProgram(
  input: CreateProgramInput,
): Promise<ServiceResult<Program>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert({
      name: input.name,
      malayalam_name: input.malayalamName || null,
      stage_type: input.stage_type,
      category: input.category,
      participation_type: input.participation_type,
      max_team_size: input.maxTeamSize ? Number(input.maxTeamSize) : null,
      hide_results: input.hideResults ?? false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not create the program. Please try again." };
  }

  return { success: true, data };
}

export async function updateProgram(
  id: string,
  input: ProgramInput,
): Promise<ServiceResult<Program>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .update({
      name: input.name,
      malayalam_name: input.malayalamName || null,
      stage_type: input.stage_type,
      category: input.category,
      max_team_size: input.maxTeamSize ? Number(input.maxTeamSize) : null,
      hide_results: input.hideResults ?? false,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the program. Please try again." };
  }

  return { success: true, data };
}

/**
 * One-way conversion of an already-created individual program to a group program
 * (D-025 extension): for pre-launch data entry where students were assigned
 * individually before it was decided the program is actually a team event. Every
 * house that already has a student assigned here gets a team entry with a placeholder
 * chest number, and every already-assigned student is re-pointed at their house's new
 * entry (group_entry_id) so the existing roster actually shows up under its team
 * instead of every freshly created team reading "no students added yet" (a group
 * program's UI only shows students under a house's team entry, keyed by
 * group_entry_id, not by house alone).
 * The caller (convertProgramToGroupAction) is responsible for blocking this once any
 * judge has scored the program — this function doesn't re-check that itself.
 */
export async function convertProgramToGroup(id: string): Promise<ServiceResult<Program>> {
  const supabase = await createClient();

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("participation_type")
    .eq("id", id)
    .single();

  if (programError || !program) {
    return { success: false, error: "Program not found." };
  }

  if (program.participation_type === "group") {
    return { success: false, error: "This program is already a group program." };
  }

  const { data: assigned, error: assignedError } = await supabase
    .from("program_students")
    .select("student_id, students(group_id)")
    .eq("program_id", id);

  if (assignedError) {
    return { success: false, error: "Could not read the current roster. Please try again." };
  }

  // studentId -> groupId (house), used below to re-point each student's row at their
  // house's newly created entry once it exists.
  const groupIdByStudent = new Map<string, string>();
  for (const row of assigned) {
    if (row.student_id && row.students) {
      groupIdByStudent.set(row.student_id, row.students.group_id);
    }
  }
  const groupIds = [...new Set(groupIdByStudent.values())];

  const { data: updated, error: updateError } = await supabase
    .from("programs")
    .update({ participation_type: "group" })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: "Could not convert the program. Please try again." };
  }

  if (groupIds.length > 0) {
    const { data: insertedEntries, error: entriesError } = await supabase
      .from("program_group_entries")
      .insert(
        groupIds.map((groupId, index) => ({
          program_id: id,
          group_id: groupId,
          chest_number: `TBD-${index + 1}`,
        })),
      )
      .select("id, group_id");

    if (entriesError || !insertedEntries) {
      return {
        success: false,
        error:
          "Converted, but couldn't auto-create team entries for the existing roster. Add them manually from the Teams panel.",
      };
    }

    const entryIdByGroup = new Map(insertedEntries.map((e) => [e.group_id, e.id]));

    for (const [studentId, groupId] of groupIdByStudent) {
      const entryId = entryIdByGroup.get(groupId);
      if (!entryId) continue;

      const { error: moveError } = await supabase
        .from("program_students")
        .update({ group_entry_id: entryId })
        .eq("program_id", id)
        .eq("student_id", studentId);

      if (moveError) {
        return {
          success: false,
          error:
            "Converted and created team entries, but couldn't move the existing roster onto them. Add members manually from the Teams panel.",
        };
      }
    }
  }

  return { success: true, data: updated };
}

export async function deleteProgram(id: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error:
        "Could not delete the program. It may still have students, judges, or scores attached to it.",
    };
  }

  return { success: true, data: null };
}
