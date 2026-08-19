import type { Database } from "@/types/database.types";

export type Student = Database["public"]["Tables"]["students"]["Row"] & {
  categories: string[];
};

/** What the admin students table actually displays — the student plus its group's name,
 * since showing a raw group_id UUID would mean nothing to anyone. */
export type StudentWithGroup = Student & {
  group_name: string | null;
};
