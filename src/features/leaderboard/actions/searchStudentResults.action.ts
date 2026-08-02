"use server";

import { searchStudentResults, type StudentSearchResult } from "@/lib/services/result.service";

/**
 * Thin Server Action wrapper so the client-side search box (StudentSearchBar) never
 * needs a direct Supabase call or the RPC name inlined into its own bundle — same
 * "actions call services" split as every other feature in this app. No auth check: this
 * is the audience's own public page (D-019), same as every other read here.
 */
export async function searchStudentResultsAction(query: string): Promise<StudentSearchResult[]> {
  return searchStudentResults(query);
}
