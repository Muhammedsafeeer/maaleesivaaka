/**
 * Scoring and points constants.
 *
 * Source: docs/project.md §Score Submission, §Group Leaderboard
 *         docs/decisions.md D-004 (tie handling)
 *
 * `project.md` notes these point values "should be configurable later". When the admin
 * settings module arrives, these become defaults seeded into a settings table rather than
 * literals — which is precisely why they are named here instead of scattered as magic
 * numbers through the scoring service.
 */

/** Judges submit a single total score in this inclusive range. */
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/**
 * Points awarded to a student's main group for a podium finish.
 *
 * Per decisions.md D-004, tied students each receive the FULL points for their shared
 * position, so a program's total payout is not fixed — a three-way tie for first awards
 * 15 points from a single program. That is intended.
 */
export const POSITION_POINTS = {
  1: 5,
  2: 3,
  3: 1,
} as const;

/** Positions outside the podium contribute nothing to the group leaderboard. */
export const POINTS_FOR_UNPLACED = 0;

/** Positions that earn points. Derived, so it can never drift from POSITION_POINTS. */
export const SCORING_POSITIONS = Object.keys(POSITION_POINTS).map(Number);

export type ScoringPosition = keyof typeof POSITION_POINTS;

/**
 * Note: the position → points *lookup* is a business rule and belongs in
 * `lib/services/scoring.service.ts`, not here. This module holds values only.
 */
