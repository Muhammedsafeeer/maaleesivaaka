import { requireRole } from "@/lib/services/auth.service";

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("judge");

  return <>{children}</>;
}
