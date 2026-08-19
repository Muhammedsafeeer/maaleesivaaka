import { z } from "zod";

/** Creating a team entry: just pick the house — the chest number (and its set number)
 * are generated automatically (groupEntry.service.ts's computeChestNumber), not
 * admin-typed. A house can have more than one entry (multiple sets), so there's no
 * "already has a team" restriction here. */
export const createGroupEntrySchema = z.object({
  group_id: z.uuid("Select a house."),
});

export type CreateGroupEntryInput = z.infer<typeof createGroupEntrySchema>;

/** Renaming an existing team entry's chest number. */
export const groupEntryChestNumberSchema = z.object({
  chest_number: z.string().min(1, "Chest number is required.").max(50),
});

export type GroupEntryChestNumberInput = z.infer<typeof groupEntryChestNumberSchema>;
