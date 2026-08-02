import type { Metadata } from "next";
import Link from "next/link";
import {
  GraduationCapIcon,
  ListMusicIcon,
  UsersIcon,
  GavelIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeaderboardList } from "@/components/dashboard/LeaderboardList";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <RealtimeLeaderboardListener />
      <div>
        <h1 className="font-heading text-xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of the festival. Click a card to jump into that section.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Students"
          value={stats.totalStudents}
          href="/admin/students"
          icon={<GraduationCapIcon className="size-4" />}
        />
        <StatCard
          label="Programs"
          value={stats.totalPrograms}
          href="/admin/programs"
          icon={<ListMusicIcon className="size-4" />}
        />
        <StatCard
          label="Groups"
          value={stats.totalGroups}
          href="/admin/groups"
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Judges"
          value={stats.totalJudges}
          href="/admin/judges"
          icon={<GavelIcon className="size-4" />}
        />
        <StatCard
          label="Completed"
          value={stats.completedPrograms}
          href="/admin/programs"
          icon={<CheckCircle2Icon className="size-4" />}
        />
        <StatCard
          label="Pending"
          value={stats.pendingPrograms}
          href="/admin/programs"
          icon={<ClockIcon className="size-4" />}
        />
      </div>

      <Card className="transition-shadow duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/leaderboard">View full leaderboard →</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <LeaderboardList rows={stats.topGroups} />
        </CardContent>
      </Card>
    </div>
  );
}
