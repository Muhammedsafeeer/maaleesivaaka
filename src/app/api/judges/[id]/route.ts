import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/services/auth.service";
import type { Database } from "@/types/database.types";

/**
 * D-006: second (and last) use of the service role key — see route.ts's header comment
 * for why this stays inline rather than a shared lib/supabase/admin.ts factory.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
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
