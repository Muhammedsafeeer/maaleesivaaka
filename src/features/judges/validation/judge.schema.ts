import { z } from "zod";

/**
 * Shared by the create-judge dialog's zodResolver and the route handler's own
 * re-validation (see src/app/api/judges/route.ts — a route handler is a real HTTP
 * endpoint, same "never trust the client" reasoning as a Server Action).
 *
 * password min(6) matches Supabase Auth's own default minimum, same as
 * features/auth/validation/login.schema.ts.
 */
export const createJudgeSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type CreateJudgeInput = z.infer<typeof createJudgeSchema>;

/**
 * Name only — editing email or password would need Supabase Auth's own confirmation
 * flows (a real feature, not built here). Shared by the edit dialog and
 * updateJudgeAction's re-validation.
 */
export const editJudgeSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
});

export type EditJudgeInput = z.infer<typeof editJudgeSchema>;
