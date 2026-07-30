import { requireRole } from "@/lib/services/auth.service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return <>{children}</>;
}
