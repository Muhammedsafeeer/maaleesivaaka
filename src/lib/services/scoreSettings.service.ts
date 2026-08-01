import { createClient } from "@/lib/supabase/server";
import { DEFAULT_POSITION_POINTS } from "@/constants/scoring";

<<<<<<< HEAD
export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

=======
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
export type ScoreSettings = {
  firstPlacePoints: number;
  secondPlacePoints: number;
  thirdPlacePoints: number;
};

<<<<<<< HEAD
const FALLBACK_SETTINGS: ScoreSettings = {
  firstPlacePoints: DEFAULT_POSITION_POINTS[1],
  secondPlacePoints: DEFAULT_POSITION_POINTS[2],
  thirdPlacePoints: DEFAULT_POSITION_POINTS[3],
};

/**
 * The singleton row (id = 1, seeded by the 20260731140000 migration). Falls back to
 * DEFAULT_POSITION_POINTS on any read failure rather than throwing — this is read
 * mid-request by finalizeIfComplete() right after a judge submits a score, and a
 * missing/unreadable settings row shouldn't block scoring from finalizing.
 */
=======
/** The single `score_settings` row — podium points used by result.service.ts when
 * ranking a program. Falls back to DEFAULT_POSITION_POINTS if the row is ever missing
 * (it's seeded by migration, so this is a defensive fallback, not the expected path). */
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
export async function getScoreSettings(): Promise<ScoreSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("score_settings")
    .select("first_place_points, second_place_points, third_place_points")
<<<<<<< HEAD
    .eq("id", 1)
    .single();

  if (error || !data) {
    return FALLBACK_SETTINGS;
=======
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      firstPlacePoints: DEFAULT_POSITION_POINTS[1],
      secondPlacePoints: DEFAULT_POSITION_POINTS[2],
      thirdPlacePoints: DEFAULT_POSITION_POINTS[3],
    };
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
  }

  return {
    firstPlacePoints: data.first_place_points,
    secondPlacePoints: data.second_place_points,
    thirdPlacePoints: data.third_place_points,
  };
}
<<<<<<< HEAD

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
    })
    .eq("id", 1)
    .select("first_place_points, second_place_points, third_place_points")
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
    },
  };
}
=======
>>>>>>> e9a82d3 (feat: implement scoreSettings and scoringCriteria services for program rubric management)
