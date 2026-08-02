import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/constants/programs";
import type { StudentWithGroup } from "@/types/student";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/** Compact students-wise preview for the dashboard — sits beside the leaderboard,
 * same row, same row-list shape as LeaderboardList. */
export function StudentsPreviewList({ students }: { students: StudentWithGroup[] }) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No students yet"
        description="Students you add will show up here."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {students.map((student) => (
        <li
          key={student.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-house-blue/20 bg-house-blue/5 px-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-3">
            <PhotoThumbnail url={student.photo_url} alt={`${student.name} photo`} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{student.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                Roll {student.roll_number} · Class {student.class}
                {student.group_name ? ` · ${student.group_name}` : ""}
              </span>
            </span>
          </span>
          <Badge variant="outline" className="shrink-0 border-house-blue/30 text-house-blue">
            {categoryLabels[student.category]}
          </Badge>
        </li>
      ))}
    </ol>
  );
}
