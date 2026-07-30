"use server";

import { redirect } from "next/navigation";
import { loginSchema, type LoginInput } from "@/features/auth/validation/login.schema";
import { signIn, getCurrentUser } from "@/lib/services/auth.service";
import { ROLE_HOME } from "@/constants/roles";

export type LoginActionResult = { error: string } | undefined;

/**
 * Called directly from the client after react-hook-form's zodResolver has already
 * validated `input` — but re-validates here too, because a Server Action is a real
 * network endpoint any client can call directly, bypassing whatever the browser did.
 *
 * Mandated call chain (docs/agents.md, src/lib/services/README.md):
 * Component -> Server Action (this file, validate + authorize) -> Service -> Supabase.
 */
export async function loginAction(input: LoginInput): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await signIn(parsed.data.email, parsed.data.password);

  if (!result.success) {
    return { error: result.error };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      error: "Signed in, but no profile was found for this account. Contact an admin.",
    };
  }

  // redirect() throws internally — Next.js's router catches it, so nothing after this
  // line runs and no further return is needed.
  redirect(ROLE_HOME[user.role]);
}
