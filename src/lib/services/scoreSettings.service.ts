import { createClient } from "@/lib/supabase/server";
import { DEFAULT_POSITION_POINTS, DEFAULT_GROUP_POSITION_POINTS } from "@/constants/scoring";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type ScoreSettings = {
  firstPlacePoints: number;
  secondPlacePoints: number;
  thirdPlacePoints: number;
  /** Used instead of the plain fields above for a GROUP (team) program's own podium —
   * see result.service.ts's finalizeIfComplete, which picks the set based on the
   * program's participation_type. */
  groupFirstPlacePoints: number;
  groupSecondPlacePoints: number;
  groupThirdPlacePoints: number;
  /** When true, a judge can keep revising their own scores for a program that's
   * 'completed' but not yet 'published' — see scoring.service.ts's submitScores/
   * submitTeamScores and the judge scoring page's canEdit. Never applies once
   * 'published', regardless of this setting. */
  allowJudgeRescore: boolean;
};

const FALLBACK_SETTINGS: ScoreSettings = {
  firstPlacePoints: DEFAULT_POSITION_POINTS[1],
  secondPlacePoints: DEFAULT_POSITION_POINTS[2],
  thirdPlacePoints: DEFAULT_POSITION_POINTS[3],
  groupFirstPlacePoints: DEFAULT_GROUP_POSITION_POINTS[1],
  groupSecondPlacePoints: DEFAULT_GROUP_POSITION_POINTS[2],
  groupThirdPlacePoints: DEFAULT_GROUP_POSITION_POINTS[3],
  allowJudgeRescore: false,
};

const SCORE_SETTINGS_COLUMNS =
  "first_place_points, second_place_points, third_place_points, group_first_place_points, group_second_place_points, group_third_place_points, allow_judge_rescore";

/**
 * The singleton row (id = 1, seeded by the 20260731140000 migration, group_* columns
 * added by 20260823010000, allow_judge_rescore by 20260823020000). Falls back to
 * DEFAULT_POSITION_POINTS/DEFAULT_GROUP_POSITION_POINTS (and allowJudgeRescore: false)
 * on any read failure rather than throwing — this is read mid-request by
 * finalizeIfComplete() right after a judge submits a score, and a missing/unreadable
 * settings row shouldn't block scoring from finalizing.
 */
export async function getScoreSettings(): Promise<ScoreSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_settings")
    .select(SCORE_SETTINGS_COLUMNS)
    .eq("id", 1)
    .single();

  if (error || !data) {
    return FALLBACK_SETTINGS;
  }

  return {
    firstPlacePoints: data.first_place_points,
    secondPlacePoints: data.second_place_points,
    thirdPlacePoints: data.third_place_points,
    groupFirstPlacePoints: data.group_first_place_points,
    groupSecondPlacePoints: data.group_second_place_points,
    groupThirdPlacePoints: data.group_third_place_points,
    allowJudgeRescore: data.allow_judge_rescore,
  };
}

export async function updateScoreSettings(
  settings: ScoreSettings,
): Promise<ServiceResult<ScoreSettings>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_settings")
    .update({
      first_place_points: settings.firstPlacePoints,
      second_place_points: settings.secondPlacePoints,
      third_place_points: settings.thirdPlacePoints,
      group_first_place_points: settings.groupFirstPlacePoints,
      group_second_place_points: settings.groupSecondPlacePoints,
      group_third_place_points: settings.groupThirdPlacePoints,
      allow_judge_rescore: settings.allowJudgeRescore,
    })
    .eq("id", 1)
    .select(SCORE_SETTINGS_COLUMNS)
    .single();

  if (error || !data) {
    return { success: false, error: "Could not save the points. Please try again." };
  }

  return {
    success: true,
    data: {
      firstPlacePoints: data.first_place_points,
      secondPlacePoints: data.second_place_points,
      thirdPlacePoints: data.third_place_points,
      groupFirstPlacePoints: data.group_first_place_points,
      groupSecondPlacePoints: data.group_second_place_points,
      groupThirdPlacePoints: data.group_third_place_points,
      allowJudgeRescore: data.allow_judge_rescore,
    },
  };
}
