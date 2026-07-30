import type { Database } from "@/types/database.types";

/**
 * Crosses feature boundaries (used by src/proxy.ts, the admin/judge layouts, and
 * features/auth) — per src/types/README.md, that's what belongs in this folder rather
 * than inside a single feature.
 */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
