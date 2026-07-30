import { z } from "zod";

/**
 * Shared by the login page (react-hook-form's zodResolver) and loginAction — one
 * schema, per docs/agents.md: "Validation must exist on: Client, Server."
 *
 * min(6) matches Supabase Auth's own default minimum password length, so a password
 * that passes this schema never gets rejected again by Supabase for being too short.
 */
export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;
