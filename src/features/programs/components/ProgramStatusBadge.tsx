import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROGRAM_STATUSES, type ProgramStatus } from "@/constants/programs";

const statusLabels = Object.fromEntries(PROGRAM_STATUSES.map((s) => [s.value, s.label]));

/** One color per lifecycle stage (constants/programs.ts) so the status reads at a
 * glance across the programs table, fixture list, and "now on stage" card — grey
 * (not started), blue (queued), gold + pulse (live now), green (done), primary
 * (released to the audience). */
const STATUS_STYLES: Record<ProgramStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  upcoming: "border-house-blue/30 bg-house-blue/10 text-house-blue",
  scoring: "border-podium-gold/40 bg-podium-gold/20 text-podium-gold animate-pulse",
  completed: "border-house-green/30 bg-house-green/10 text-house-green",
  published: "border-transparent bg-primary text-primary-foreground",
};

export function ProgramStatusBadge({
  status,
  className,
}: {
  status: ProgramStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}
