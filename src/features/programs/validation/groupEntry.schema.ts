import { z } from "zod";

/** Creating a team entry: pick the house and give it a chest number. Shared by the
 * dialog's zodResolver and the Server Action's re-validation, same pattern as every
 * other schema in this codebase. */
export const createGroupEntrySchema = z.object({
  group_id: z.uuid("Select a house."),
  chest_number: z.string().min(1, "Chest number is required.").max(50),
});

export type CreateGroupEntryInput = z.infer<typeof createGroupEntrySchema>;

/** Renaming an existing team entry's chest number. */
export const groupEntryChestNumberSchema = z.object({
  chest_number: z.string().min(1, "Chest number is required.").max(50),
});

export type GroupEntryChestNumberInput = z.infer<typeof groupEntryChestNumberSchema>;
