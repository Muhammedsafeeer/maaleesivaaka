import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  className?: string;
};

/**
 * Shared by the admin dashboard (Phase 8) and, per components/README.md, the judge
 * dashboard later (Phase 12) — "Assigned/Pending/Completed Programs" there is the same
 * shape as "Total/Completed/Pending" here. Purely presentational: formatting a number
 * for display is fine here, deciding what counts as "completed" is not (that's the
 * service layer's job).
 */
export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
