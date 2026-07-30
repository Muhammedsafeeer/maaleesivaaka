"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/services/auth.service";
import { LOGIN_ROUTE } from "@/constants/roles";

/**
 * No error state to report back — signing out doesn't meaningfully fail from the
 * user's perspective, so this is a plain form action rather than useActionState.
 */
export async function logoutAction(): Promise<void> {
  await signOut();
  redirect(LOGIN_ROUTE);
}
