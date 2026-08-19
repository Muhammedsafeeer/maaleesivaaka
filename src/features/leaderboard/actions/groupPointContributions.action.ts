"use server";

import {
  listGroupPointContributions,
  type GroupPointContribution,
} from "@/lib/services/leaderboard.service";
import { assertAdmin } from "@/lib/services/auth.service";

/**
 * Admin-only drill-down: which students actually contributed to one house's
 * total_points on /admin/leaderboard. Unlike the audience-facing leaderboard reads in
 * this same folder, this one IS gated — it names individual students, and the admin
 * dashboard is the only place that's ever appropriate (D-017 keeps every public surface
 * house-only).
 */
export async function listGroupPointContributionsAction(
  groupId: string,
): Promise<GroupPointContribution[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];

  return listGroupPointContributions(groupId);
}
