import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/services/auth.service";
import { updateJudgePasswordSchema } from "@/features/judges/validation/judge.schema";
import type { Database } from "@/types/database.types";

/**
 * D-006: the service role key is used in exactly three places in this codebase — this
 * file's DELETE and PATCH, and route.ts's POST. All instantiate their own client
 * inline rather than importing a shared lib/supabase/admin.ts factory — that factory
 * would make the privileged client trivially reusable from anywhere, exactly what
 * D-006 exists to prevent.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await params;

  const supabaseAdmin = createServiceRoleClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // judge_scores.judge_id is ON DELETE RESTRICT (Phase 5) — deleting the auth user
  // cascades to profiles (ON DELETE CASCADE), which then hits the RESTRICT and fails
  // the whole operation cleanly if this judge already has scoring history.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json(
      { error: "Could not delete the judge. They may have already submitted scores." },
      { status: 400 },
    );
  }

  revalidatePath("/admin/judges");
  return NextResponse.json({ success: true });
}

/**
 * Resets a judge's password. Same reasoning as POST /api/judges needing the Admin API
 * to call auth.admin.createUser: only the service role key can set another user's
 * password (auth.admin.updateUserById) — a Server Action can't, since it runs with the
 * caller's own session. There's no old-password confirmation step because the admin
 * setting this is, by definition, not the judge — same trust model as creating the
 * account with an admin-chosen password in the first place.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateJudgePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabaseAdmin = createServiceRoleClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not update the judge's password. Please try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
