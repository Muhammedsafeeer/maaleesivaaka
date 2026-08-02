import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { listFixture, listProgramRoster } from "@/lib/services/fixture.service";
import { FixtureList } from "@/features/programs/components/FixtureList";
import { CurrentProgramCard } from "@/features/programs/components/CurrentProgramCard";
import { ProgramRoster } from "@/features/programs/components/ProgramRoster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { RealtimeJudgeScoresListener } from "@/components/dashboard/RealtimeJudgeScoresListener";
import { STAGE_TYPES, type StageType } from "@/constants/programs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fixture",
};

const CURRENT_STATUSES = ["scoring"];

type FixturePageProps = {
  searchParams: Promise<{ stage?: string }>;
};

export default async function FixturePage({ searchParams }: FixturePageProps) {
  const params = await searchParams;
  const stageType: StageType =
    params.stage === "off_stage" ? "off_stage" : "on_stage";

  const programs = await listFixture(stageType);
  const current = programs.find((p) => CURRENT_STATUSES.includes(p.status)) ?? null;
  const next =
    programs.find((p) => p.status === "upcoming" && p.serial_number !== null) ?? null;
  const roster = current ? await listProgramRoster(current.id) : null;

  return (
    <div className="flex flex-col gap-6">
      <RealtimeProgramsListener />
      <RealtimeJudgeScoresListener />

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-green/15 text-house-green">
          <CalendarClock className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-medium">Fixture</h1>
          <p className="text-sm text-muted-foreground">
            Running order per stage. Set a program to Upcoming to queue it — it gets the
            next serial number automatically — then drag upcoming programs to reorder
            them. Click &quot;Start next program&quot; below to put the first one on stage;
            after that, whichever program is queued next starts automatically as soon as
            the current one is completed. Click a name to manage its roster, judges, and
            results. A program that&apos;s already scoring, completed, or published keeps
            its serial number and can&apos;t be dragged.
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-1">
        {STAGE_TYPES.map((s) => {
          const isActive = s.value === stageType;
          return (
            <Link
              key={s.value}
              href={`/admin/fixture?stage=${s.value}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-house-green text-white shadow-sm"
                  : "text-muted-foreground hover:bg-house-green/10 hover:text-house-green",
              )}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FixtureList programs={programs} stageType={stageType} />
        </div>
        <div className="flex flex-col gap-6">
          <CurrentProgramCard stageType={stageType} current={current} next={next} />

          {current && roster ? (
            <Card>
              <CardHeader>
                <CardTitle>Students — {current.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgramRoster roster={roster} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
