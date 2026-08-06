import { z } from "zod";

/** Shared by the create/edit dialog's zodResolver and the Server Action's re-validation. */
export const adSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  playDurationSeconds: z
    .number()
    .int("Play duration must be a whole number of seconds.")
    .min(1, "Play duration must be at least 1 second.")
    .max(300, "Play duration must be 300 seconds or fewer."),
  transitionDurationMs: z
    .number()
    .int("Transition duration must be a whole number of milliseconds.")
    .min(0, "Transition duration can't be negative.")
    .max(5000, "Transition duration must be 5000ms or fewer."),
});

export type AdInput = z.infer<typeof adSchema>;
