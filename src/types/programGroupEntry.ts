import type { Database } from "@/types/database.types";

export type ProgramGroupEntry = Database["public"]["Tables"]["program_group_entries"]["Row"];

/** What the roster panel actually displays — the entry plus its house's name, since a
 * raw group_id UUID would mean nothing to anyone. */
export type ProgramGroupEntryWithGroup = ProgramGroupEntry & {
  group_name: string | null;
};
