import type { Database } from "@/types/database.types";

/** Crosses feature boundaries (dashboard stat queries read this too, not just
 * features/groups) — per src/types/README.md, that's what belongs here. */
export type Group = Database["public"]["Tables"]["main_groups"]["Row"];
