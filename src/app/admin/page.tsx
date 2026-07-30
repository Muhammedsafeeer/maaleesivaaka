import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of the festival.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Students" value={stats.totalStudents} />
        <StatCard label="Programs" value={stats.totalPrograms} />
        <StatCard label="Groups" value={stats.totalGroups} />
        <StatCard label="Judges" value={stats.totalJudges} />
        <StatCard label="Completed" value={stats.completedPrograms} />
        <StatCard label="Pending" value={stats.pendingPrograms} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topGroups.length === 0 ? (
            <EmptyState
              title="No results yet"
              description="The leaderboard fills in once judges start submitting scores."
            />
          ) : (
            <ol className="flex flex-col gap-2">
              {stats.topGroups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-mono tabular-nums text-muted-foreground">
                      #{group.rank}
                    </span>
                    <PhotoThumbnail url={group.photo_url} alt={`${group.name} photo`} />
                    <span className="font-medium">{group.name}</span>
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {group.total_points} pts
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
