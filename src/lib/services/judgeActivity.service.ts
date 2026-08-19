import { createClient } from "@/lib/supabase/server";
import type { ProgramStatus } from "@/constants/programs";

export type LiveJudgeLatestScore = {
  studentName: string;
  score: number;
  submittedAt: string;
  programName: string;
};

export type LiveJudgeProgramProgress = {
  programId: string;
  programName: string;
  category: string;
  status: ProgramStatus;
  scoredCount: number;
  totalStudents: number;
};

export type LiveJudgeActivity = {
  judgeId: string;
  name: string;
  email: string;
  programs: LiveJudgeProgramProgress[];
  latestScore: LiveJudgeLatestScore | null;
};

type AssignedProgramJoin = {
  id: string;
  name: string;
  category: string;
  status: ProgramStatus;
};

type AssignmentRow = {
  judge_id: string;
  programs: AssignedProgramJoin | AssignedProgramJoin[] | null;
};

type ScoreRow = {
  judge_id: string;
  program_id: string;
  score: number;
  submitted_at: string;
  students: { name: string } | { name: string }[] | null;
  program_group_entries:
    | { chest_number: string; main_groups: { name: string } | { name: string }[] | null }
    | { chest_number: string; main_groups: { name: string } | { name: string }[] | null }[]
    | null;
};

function asOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Admin-only snapshot of every judge's assigned-program scoring progress, plus the
 * most recent score each judge submitted. Combined on the dashboard with Realtime
 * Presence (who is logged in right now) so the admin sees live scoring without
 * polling.
 */
export async function listLiveJudgeActivity(): Promise<LiveJudgeActivity[]> {
  const supabase = await createClient();

  const [{ data: judges }, { data: assignmentRows }, { data: studentRows }, { data: teamRows }, { data: scoreRows }] =
    await Promise.all([
      supabase.from("profiles").select("id, name, email").eq("role", "judge").order("name"),
      supabase.from("program_judges").select("judge_id, programs(id, name, category, status)"),
      supabase.from("program_students").select("program_id"),
      supabase.from("program_group_entries").select("program_id"),
      supabase
        .from("judge_scores")
        .select(
          "judge_id, program_id, score, submitted_at, students(name), program_group_entries(chest_number, main_groups(name))",
        )
        .order("submitted_at", { ascending: false }),
    ]);

  if (!judges || judges.length === 0) {
    return [];
  }

  // D-025 follow-up: "total" is the count of scorable targets — students for an
  // individual program, team entries for a group program, since scoring happens once
  // per team, not once per member.
  const totalByProgram = new Map<string, number>();
  for (const row of studentRows ?? []) {
    totalByProgram.set(row.program_id, (totalByProgram.get(row.program_id) ?? 0) + 1);
  }
  for (const row of teamRows ?? []) {
    totalByProgram.set(row.program_id, (totalByProgram.get(row.program_id) ?? 0) + 1);
  }

  const programById = new Map<string, AssignedProgramJoin>();
  const assignmentsByJudge = new Map<string, AssignedProgramJoin[]>();
  for (const row of (assignmentRows ?? []) as AssignmentRow[]) {
    const program = asOne(row.programs);
    if (!program || program.status === "draft") continue;
    programById.set(program.id, program);
    const list = assignmentsByJudge.get(row.judge_id) ?? [];
    list.push(program);
    assignmentsByJudge.set(row.judge_id, list);
  }

  const scoredByJudgeProgram = new Map<string, number>();
  const latestByJudge = new Map<string, LiveJudgeLatestScore>();
  for (const row of (scoreRows ?? []) as ScoreRow[]) {
    const key = `${row.judge_id}:${row.program_id}`;
    scoredByJudgeProgram.set(key, (scoredByJudgeProgram.get(key) ?? 0) + 1);

    if (!latestByJudge.has(row.judge_id)) {
      const student = asOne(row.students);
      const entry = asOne(row.program_group_entries);
      const entryGroup = entry ? asOne(entry.main_groups) : null;
      const program = programById.get(row.program_id);
      // D-025 follow-up: a group program's row has no student (scored once per team,
      // keyed by group_entry_id) — falls back to "<House> · Chest <n>" instead of the
      // generic "Student" placeholder.
      const displayName = student?.name ?? (entryGroup ? `${entryGroup.name} · Chest ${entry!.chest_number}` : "Student");
      latestByJudge.set(row.judge_id, {
        studentName: displayName,
        score: row.score,
        submittedAt: row.submitted_at,
        programName: program?.name ?? "Program",
      });
    }
  }

  return judges.map((judge) => {
    const programs = (assignmentsByJudge.get(judge.id) ?? []).map((program) => ({
      programId: program.id,
      programName: program.name,
      category: program.category,
      status: program.status,
      scoredCount: scoredByJudgeProgram.get(`${judge.id}:${program.id}`) ?? 0,
      totalStudents: totalByProgram.get(program.id) ?? 0,
    }));

    return {
      judgeId: judge.id,
      name: judge.name,
      email: judge.email,
      programs,
      latestScore: latestByJudge.get(judge.id) ?? null,
    };
  });
}
