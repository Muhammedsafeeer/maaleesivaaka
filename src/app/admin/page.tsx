import type { Metadata } from "next";
import Link from "next/link";
import {
  GraduationCapIcon,
  ListMusicIcon,
  UsersIcon,
  GavelIcon,
  CheckCircle2Icon,
  ClockIcon,
  TrophyIcon,
} from "lucide-react";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { listLiveJudgeActivity } from "@/lib/services/judgeActivity.service";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeaderboardList } from "@/components/dashboard/LeaderboardList";
import { StudentsPreviewList } from "@/components/dashboard/StudentsPreviewList";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { RealtimeJudgeScoresListener } from "@/components/dashboard/RealtimeJudgeScoresListener";
import { LiveJudgesPanel } from "@/features/judges/components/LiveJudgesPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const [stats, judgeActivity] = await Promise.all([
    getDashboardStats(),
    listLiveJudgeActivity(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <RealtimeLeaderboardListener />
      <RealtimeJudgeScoresListener />
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

      <LiveJudgesPanel activity={judgeActivity} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          size="sm"
          className="ring-podium-gold/30 transition-shadow duration-200 hover:shadow-md"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-podium-gold/15 text-podium-gold">
                <TrophyIcon className="size-3.5" />
              </span>
              Leaderboard
            </CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/leaderboard">View all →</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <LeaderboardList rows={stats.topGroups} compact />
          </CardContent>
        </Card>

        <Card
          size="sm"
          className="ring-house-blue/30 transition-shadow duration-200 hover:shadow-md"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-house-blue/15 text-house-blue">
                <GraduationCapIcon className="size-3.5" />
              </span>
              Students
            </CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/students">View all →</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <StudentsPreviewList students={stats.recentStudents} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
