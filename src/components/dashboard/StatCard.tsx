import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
};

/**
 * Shared by the admin dashboard (Phase 8) and, per components/README.md, the judge
 * dashboard later (Phase 12) — "Assigned/Pending/Completed Programs" there is the same
 * shape as "Total/Completed/Pending" here. Purely presentational: formatting a number
 * for display is fine here, deciding what counts as "completed" is not (that's the
 * service layer's job).
 *
 * When `href` is given the whole card becomes a link (e.g. "Students" → /admin/students)
 * with a hover/focus lift so it reads as clickable, not just decorative.
 */
export function StatCard({ label, value, href, icon, className }: StatCardProps) {
  const card = (
    <Card
      size="sm"
      className={cn(
        "transition-all duration-200 ease-out",
        href &&
          "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40 active:translate-y-0 active:shadow-md",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-normal text-muted-foreground">
          <span>{label}</span>
          {icon ? (
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  );
}
