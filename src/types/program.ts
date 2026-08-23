import type { Database } from "@/types/database.types";

export type Program = Database["public"]["Tables"]["programs"]["Row"];

/** A "dummy row" in the Fixture running order for a break between programs — not a
 * real program (no students/judges/category/scoring), but a first-class, draggable
 * entry in the same stage_type + serial_number running order. See
 * fixture.service.ts's FixtureEntry, which merges these with Program rows for the
 * Fixture page. */
export type FixtureBreak = Database["public"]["Tables"]["fixture_breaks"]["Row"];
export type FixtureBreakStatus = "upcoming" | "scoring" | "completed";
