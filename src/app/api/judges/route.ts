import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/services/auth.service";
import { createJudgeSchema } from "@/features/judges/validation/judge.schema";
import type { Database } from "@/types/database.types";

/**
 * D-006: the service role key is used in exactly three places in this codebase — this
 * file's POST, and src/app/api/judges/[id]/route.ts's DELETE and PATCH. All
 * instantiate their own client inline rather than importing a shared
 * lib/supabase/admin.ts factory — that factory would make the privileged client
 * trivially reusable from anywhere, exactly what D-006 exists to prevent. This is a
 * genuine route handler, not a Server Action, because Server Actions run with the
 * CALLER's session — creating an auth.users row needs the Admin API, which only the
 * service role key can call (see app/README.md § Route handlers vs Server Actions).
 */
export async function POST(request: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createJudgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const supabaseAdmin = createServiceRoleClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // email_confirm: true — no email-sending infrastructure exists in this stack (no
  // SMTP configured, not part of the documented stack), so the judge must be able to
  // sign in immediately with the password the admin sets, same as the Phase 6
  // dashboard-created first admin ("Auto Confirm User").
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: "Could not create the judge account. The email may already be in use." },
      { status: 400 },
    );
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: authUser.user.id, name, email, role: "judge" });

  if (profileError) {
    // The two-step create (auth user, then profile row) isn't one atomic transaction
    // across two systems — clean up the orphaned auth user rather than leave a ghost
    // account that silently blocks retrying with the same email.
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Could not create the judge account. Please try again." },
      { status: 500 },
    );
  }

  revalidatePath("/admin/judges");
  return NextResponse.json({ success: true });
}
