/**
 * Scoring and points constants.
 *
 * Source: docs/project.md §Score Submission, §Group Leaderboard
 *         docs/decisions.md D-004 (tie handling)
 */

import type { ChangeEvent } from "react";

/**
 * Each scoring type (criterion) a judge fills in is bounded to this inclusive range —
 * see supabase/migrations/20260801000000_program_scoring_criteria.sql. A program's
 * total is the sum across however many criteria it has (or a single implicit one if
 * none are configured), so there's no fixed total max anymore; use
 * getMaxTotalScore() for that.
 */
export const CRITERION_SCORE_MIN = 0;
export const CRITERION_SCORE_MAX = 10;

/** A program with zero configured scoring types still gets one implicit 0–10 score. */
export function getMaxTotalScore(criteriaCount: number): number {
  return (criteriaCount || 1) * CRITERION_SCORE_MAX;
}

/**
 * Clamps a score `<input type="number">` live, in the DOM, before react-hook-form's
 * own `onChange` runs — the `min`/`max` attributes alone only affect the stepper
 * arrows, not direct typing/paste, so without this a judge could type "15" and only
 * find out it's invalid on Save. Call from an `onChange` wrapping the registered
 * field's own handler: `onChange={(e) => { clampScoreInput(e); registered.onChange(e); }}`.
 */
export function clampScoreInput(event: ChangeEvent<HTMLInputElement>): void {
  const raw = event.target.value;
  if (raw === "") return;
  const n = Number(raw);
  if (Number.isNaN(n)) return;
  if (n > CRITERION_SCORE_MAX) event.target.value = String(CRITERION_SCORE_MAX);
  else if (n < CRITERION_SCORE_MIN) event.target.value = String(CRITERION_SCORE_MIN);
}

/**
 * Default points awarded to a student's main group for a podium finish — seeded into
 * the `score_settings` table (see the 20260731140000 migration) and used as a fallback
 * if that row is ever missing. The admin's Settings page is the actual source of truth
 * at runtime; see scoreSettings.service.ts.
 *
 * Per decisions.md D-004, tied students each receive the FULL points for their shared
 * position, so a program's total payout is not fixed — a three-way tie for first awards
 * 15 points from a single program. That is intended.
 */
export const DEFAULT_POSITION_POINTS = {
  1: 5,
  2: 3,
  3: 1,
} as const;

/** Sibling default for GROUP (team) programs — admin-configured separately from
 * DEFAULT_POSITION_POINTS (see the 20260823010000 migration's group_*_points columns
 * and scoreSettings.service.ts), since a team event's podium can reasonably be worth a
 * different number of points than an individual one. Same 5/3/1 defaults so behaviour
 * is unchanged until an admin deliberately sets the two apart. */
export const DEFAULT_GROUP_POSITION_POINTS = {
  1: 5,
  2: 3,
  3: 1,
} as const;

/** Positions outside the podium contribute nothing to the group leaderboard. */
export const POINTS_FOR_UNPLACED = 0;

/** Positions that earn points. Derived, so it can never drift from DEFAULT_POSITION_POINTS. */
export const SCORING_POSITIONS = Object.keys(DEFAULT_POSITION_POINTS).map(Number);

export type ScoringPosition = keyof typeof DEFAULT_POSITION_POINTS;

/**
 * Note: the position → points *lookup* is a business rule and belongs in
 * `lib/services/scoring.service.ts`, not here. This module holds values only.
 */
