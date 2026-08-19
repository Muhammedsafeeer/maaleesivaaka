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
import { listUnresolvedTies } from "@/lib/services/result.service";
import { TiesReviewPanel } from "@/features/programs/components/TiesReviewPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeaderboardList } from "@/components/dashboard/LeaderboardList";
import { StudentsPreviewList } from "@/components/dashboard/StudentsPreviewList";
import { RealtimeJudgeScoresListener } from "@/components/dashboard/RealtimeJudgeScoresListener";
import { LiveJudgesPanel } from "@/features/judges/components/LiveJudgesPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const [stats, judgeActivity, unresolvedTies] = await Promise.all([
    getDashboardStats(),
    listLiveJudgeActivity(),
    listUnresolvedTies(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* No RealtimeLeaderboardListener here — AdminLayout already mounts one for the
          whole admin section (needed to keep the header's tie bell live everywhere).
          A second instance on this page would throw: Supabase's realtime client keys
          channels by name, and useRealtimeLeaderboard always uses the same channel
          name ("results-changes"), so two mounted instances collide on the same
          channel object instead of subscribing independently. */}
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

      <TiesReviewPanel ties={unresolvedTies} />

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
