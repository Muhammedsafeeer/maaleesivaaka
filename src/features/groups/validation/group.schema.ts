import { z } from "zod";

/** Shared by the create/edit dialog's zodResolver and the Server Action's re-validation. */
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  malayalamName: z
    .string()
    .max(100, "Malayalam name must be 100 characters or fewer.")
    .optional(),
});

export type GroupInput = z.infer<typeof groupSchema>;
