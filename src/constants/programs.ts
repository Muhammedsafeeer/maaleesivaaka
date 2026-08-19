/**
 * Program and student classification constants.
 *
 * Source: docs/project.md §Programs, §Students
 *
 * The `value` of each entry is the literal stored in PostgreSQL. The Phase 5 schema must
 * mirror these exactly — they are the contract between the database and the UI.
 */

/**
 * Age categories. A student's category MUST match a program's category for assignment
 * to be valid — enforced in the form, in the Server Action, and in the database
 * (docs/decisions.md D-007).
 */
export const CATEGORIES = [
  { value: "kids", label: "Kids" },
  { value: "sub_junior", label: "Sub Junior" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
  { value: "super_senior", label: "Super Senior" },
  { value: "general", label: "General" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

/** Malayalam counterparts of CATEGORIES' labels, for audience-facing posters/certificates. */
export const CATEGORY_MALAYALAM_LABELS: Record<Category, string> = {
  kids: "കിഡ്സ്",
  sub_junior: "സബ് ജൂനിയർ",
  junior: "ജൂനിയർ",
  senior: "സീനിയർ",
  super_senior: "സൂപ്പർ സീനിയർ",
  general: "ജനറൽ",
};

/** Whether a program is performed on stage or completed off stage. */
export const STAGE_TYPES = [
  { value: "on_stage", label: "On Stage" },
  { value: "off_stage", label: "Off Stage" },
] as const;

export type StageType = (typeof STAGE_TYPES)[number]["value"];

/** Individual: one student per entry, identified by their own chest number. Group
 * (D-025): a team of students from one house performs as a single entry, identified by
 * one shared chest number (docs/decisions.md D-025). Set once at creation; immutable
 * after. */
export const PARTICIPATION_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "group", label: "Group" },
] as const;

export type ParticipationType = (typeof PARTICIPATION_TYPES)[number]["value"];

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export type Gender = (typeof GENDERS)[number]["value"];

/** A student's school class/grade, 1 through 10 — picked from a dropdown rather than
 * free text so it stays a clean, consistent value (roll numbers are only unique
 * within a class, so a typo'd class would silently dodge that check). */
export const CLASSES = [
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
] as const;

export type StudentClass = (typeof CLASSES)[number]["value"];

/**
 * Program status lifecycle.
 *
 * Confirmed at Phase 5 design time (docs/decisions.md D-003) and simplified at Phase 17:
 * 'ongoing' was dropped (see the 20260731120000 migration) — starting a program from the
 * Fixture page has always gone straight to 'scoring', so 'ongoing' was never reachable
 * and only cluttered the admin's manual status-override control.
 *
 *   draft     - created, not yet scheduled
 *   upcoming  - scheduled, not yet started
 *   scoring   - on stage / with judges now; performance and scoring are one admin-facing step
 *   completed - all assigned judges scored; results calculated but NOT public
 *   published - admin released the results; anonymous audience can now read them
 */
export const PROGRAM_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "scoring", label: "Scoring" },
  { value: "completed", label: "Completed" },
  { value: "published", label: "Published" },
] as const;

export type ProgramStatus = (typeof PROGRAM_STATUSES)[number]["value"];

/** The only status at which results become visible to unauthenticated visitors. */
export const PUBLIC_PROGRAM_STATUS: ProgramStatus = "published";
