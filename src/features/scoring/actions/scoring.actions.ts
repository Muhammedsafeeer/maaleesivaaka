"use server";

import { revalidatePath } from "next/cache";
import {
  submitScoresSchema,
  submitTeamScoresSchema,
  type SubmitScoresInput,
  type SubmitTeamScoresInput,
} from "@/features/scoring/validation/score.schema";
import {
  submitScores,
  submitTeamScores,
  adminSubmitScores,
  adminSubmitTeamScores,
  listProgramJudgeScoreBoard,
  listScorableStudentsForJudge,
  listScorableTeamsForJudge,
  ADMIN_OVERRIDE_REQUIRED,
  type AdminOverride,
  type ServiceResult,
  type ScorableStudent,
  type ScorableTeam,
} from "@/lib/services/scoring.service";
import { finalizeIfComplete, listTiedPositions } from "@/lib/services/result.service";
import { assertJudge, assertAdmin } from "@/lib/services/auth.service";
import { getProgram } from "@/lib/services/program.service";
import { listAssignedStudents, listAssignedJudges } from "@/lib/services/assignment.service";
import { listGroupEntries } from "@/lib/services/groupEntry.service";
import {
  listScoringCriteria,
  type ScoringCriterion,
} from "@/lib/services/scoringCriteria.service";

export type ScoringActionResult =
  | { error: string; requiresAdminOverride?: boolean }
  | { error?: undefined; warning?: string };

export async function submitScoresAction(
  programId: string,
  input: SubmitScoresInput,
  adminOverride?: AdminOverride,
): Promise<ScoringActionResult> {
  const auth = await assertJudge();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await submitScores(programId, parsed.data.scores, adminOverride);
  if (!result.success) {
    if (result.error === ADMIN_OVERRIDE_REQUIRED) {
      return {
        error: adminOverride
          ? "Incorrect admin password."
          : "This changes an already-submitted score — an admin must authorize the change.",
        requiresAdminOverride: true,
      };
    }
    return { error: result.error };
  }

  // D-003: check whether this submission was the one that completed the program, and
  // if so calculate + write results. Best-effort — the score itself already saved
  // successfully, which is the operation the judge actually asked for, so a
  // finalization failure here doesn't fail their submission. It's not a silent dead
  // end either: the admin-side "Recalculate" action (D-014) can retry it.
  const finalizeResult = await finalizeIfComplete(programId);
  let warning: string | undefined;
  if (!finalizeResult.success) {
    console.error("finalizeIfComplete failed after score submission:", finalizeResult.error);
    warning = "Scores saved, but results did not recalculate. Ask an admin to click Recalculate.";
  }

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  revalidatePath(`/admin/programs/${programId}`);
  // A revision that broke (or created) a tie changes what the dashboard's "needs a
  // decision" panel shows — keep it in sync with whatever finalizeIfComplete just did.
  revalidatePath("/admin");
  return warning ? { warning } : {};
}

/** Team-scoped sibling of submitScoresAction (D-025 follow-up) — same shape, calls
 * submitTeamScores instead. Finalization/revalidation afterward is participation-type-
 * agnostic, so that part is identical to submitScoresAction's. */
export async function submitTeamScoresAction(
  programId: string,
  input: SubmitTeamScoresInput,
  adminOverride?: AdminOverride,
): Promise<ScoringActionResult> {
  const auth = await assertJudge();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitTeamScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await submitTeamScores(programId, parsed.data.scores, adminOverride);
  if (!result.success) {
    if (result.error === ADMIN_OVERRIDE_REQUIRED) {
      return {
        error: adminOverride
          ? "Incorrect admin password."
          : "This changes an already-submitted score — an admin must authorize the change.",
        requiresAdminOverride: true,
      };
    }
    return { error: result.error };
  }

  const finalizeResult = await finalizeIfComplete(programId);
  let warning: string | undefined;
  if (!finalizeResult.success) {
    console.error("finalizeIfComplete failed after team score submission:", finalizeResult.error);
    warning = "Scores saved, but results did not recalculate. Ask an admin to click Recalculate.";
  }

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  revalidatePath(`/admin/programs/${programId}`);
  // A revision that broke (or created) a tie changes what the dashboard's "needs a
  // decision" panel shows — keep it in sync with whatever finalizeIfComplete just did.
  revalidatePath("/admin");
  return warning ? { warning } : {};
}

/**
 * Admin-only sibling of submitScoresAction — same shape, but writes under an explicit
 * `judgeId` instead of the calling user's own id (see adminSubmitScores). Lets an admin
 * fix a judge's score directly from the program page — typically to break a tie the
 * judge is holding — without that judge being at their device or an override password
 * (the caller here already IS the admin that password would otherwise vouch for).
 */
export async function adminSubmitScoresAction(
  programId: string,
  judgeId: string,
  input: SubmitScoresInput,
): Promise<ScoringActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await adminSubmitScores(programId, judgeId, parsed.data.scores);
  if (!result.success) {
    return { error: result.error };
  }

  const finalizeResult = await finalizeIfComplete(programId);
  let warning: string | undefined;
  if (!finalizeResult.success) {
    console.error("finalizeIfComplete failed after admin score submission:", finalizeResult.error);
    warning = "Scores saved, but results did not recalculate. Ask an admin to click Recalculate.";
  }

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/admin");
  return warning ? { warning } : {};
}

/** Team-scoped sibling of adminSubmitScoresAction — see its docstring. */
export async function adminSubmitTeamScoresAction(
  programId: string,
  judgeId: string,
  input: SubmitTeamScoresInput,
): Promise<ScoringActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = submitTeamScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await adminSubmitTeamScores(programId, judgeId, parsed.data.scores);
  if (!result.success) {
    return { error: result.error };
  }

  const finalizeResult = await finalizeIfComplete(programId);
  let warning: string | undefined;
  if (!finalizeResult.success) {
    console.error(
      "finalizeIfComplete failed after admin team score submission:",
      finalizeResult.error,
    );
    warning = "Scores saved, but results did not recalculate. Ask an admin to click Recalculate.";
  }

  revalidatePath(`/judge/programs/${programId}`);
  revalidatePath("/judge");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/admin");
  return warning ? { warning } : {};
}

export type ScoreMatrixRow = {
  id: string;
  name: string;
  /** Class + roll number for a student, or "Chest N" for a team. */
  secondary: string;
  tied: boolean;
  scores: Record<string, number>;
};

export type ScoreMatrix = {
  isGroup: boolean;
  /** When true, a judge's number is a sum of configured scoring types, not a single
   * plain value — the fixture page's quick matrix only edits a plain total, so it
   * disables inline editing here and points to the full program page instead. */
  hasCriteria: boolean;
  judges: { id: string; label: string; name: string }[];
  rows: ScoreMatrixRow[];
};

/**
 * Backs the Fixture page's "Change score" dialog on a tied program — a quick, read-then-
 * edit view of every participant's score from every judge, without navigating away to
 * the full program page. Composes data that already exists on the program page
 * (judgeScoreBoard, roster, ties) into one shape a lazy-loaded dialog can render.
 */
export async function getScoreMatrixAction(programId: string): Promise<ServiceResult<ScoreMatrix>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const program = await getProgram(programId);
  if (!program) {
    return { success: false, error: "Program not found." };
  }

  const isGroup = program.participation_type === "group";

  const [judgeScoreBoard, assignedJudges, criteria, ties, students, groupEntries] =
    await Promise.all([
      listProgramJudgeScoreBoard(programId),
      listAssignedJudges(programId),
      listScoringCriteria(programId),
      listTiedPositions(programId),
      isGroup ? Promise.resolve([]) : listAssignedStudents(programId),
      isGroup ? listGroupEntries(programId) : Promise.resolve([]),
    ]);

  const judgeNameById = new Map(assignedJudges.map((judge) => [judge.id, judge.name]));
  const judges = judgeScoreBoard.judges.map((judge) => ({
    id: judge.id,
    label: judge.label,
    name: judgeNameById.get(judge.id) ?? judge.label,
  }));

  const tiedIds = new Set(
    ties.flatMap((group) =>
      group.participants.flatMap((p) =>
        isGroup ? (p.groupEntryId ? [p.groupEntryId] : []) : p.studentId ? [p.studentId] : [],
      ),
    ),
  );

  const rows: ScoreMatrixRow[] = isGroup
    ? groupEntries.map((entry) => ({
        id: entry.id,
        name: entry.group_name ?? "Unknown house",
        secondary: `Chest ${entry.chest_number}`,
        tied: tiedIds.has(entry.id),
        scores: judgeScoreBoard.teamScores[entry.id] ?? {},
      }))
    : students.map((student) => ({
        id: student.id,
        name: student.name,
        secondary: `${student.roll_number} · ${student.class}`,
        tied: tiedIds.has(student.id),
        scores: judgeScoreBoard.studentScores[student.id] ?? {},
      }));

  return {
    success: true,
    data: { isGroup, hasCriteria: criteria.length > 0, judges, rows },
  };
}

export type JudgeScorable = {
  isGroup: boolean;
  criteria: ScoringCriterion[];
  students: ScorableStudent[];
  teams: ScorableTeam[];
};

/**
 * One judge's full scorable roster, criteria included — the Change Score dialog's path
 * for a program with configured scoring types, where a single "score" column per judge
 * (getScoreMatrixAction's plain-total view) can't represent a per-criterion breakdown.
 * Loaded lazily only once a judge is actually picked in that dialog, not up front.
 */
export async function getJudgeScorableAction(
  programId: string,
  judgeId: string,
): Promise<ServiceResult<JudgeScorable>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const program = await getProgram(programId);
  if (!program) {
    return { success: false, error: "Program not found." };
  }

  const isGroup = program.participation_type === "group";

  const [criteria, students, teams] = await Promise.all([
    listScoringCriteria(programId),
    isGroup ? Promise.resolve([]) : listScorableStudentsForJudge(programId, judgeId),
    isGroup ? listScorableTeamsForJudge(programId, judgeId) : Promise.resolve([]),
  ]);

  return { success: true, data: { isGroup, criteria, students, teams } };
}
