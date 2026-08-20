"use client";

import { GavelIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { useOnlineJudges } from "@/hooks/useOnlineJudges";
import { CATEGORIES } from "@/constants/programs";
import type { LiveJudgeActivity } from "@/lib/services/judgeActivity.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LiveJudgesPanel({ activity }: { activity: LiveJudgeActivity[] }) {
  const online = useOnlineJudges();
  const activityById = new Map(activity.map((row) => [row.judgeId, row]));

  const rows = online.map((presence) => {
    const snapshot = activityById.get(presence.judgeId);
    const programs = snapshot?.programs ?? [];
    const current = programs.find((p) => p.programId === presence.programId) ?? null;
    const scoring = programs.filter((p) => p.status === "scoring");
    const shown = current ? [current, ...scoring.filter((p) => p.programId !== current.programId)] : scoring;

    return {
      presence,
      name: snapshot?.name ?? presence.name,
      email: snapshot?.email ?? presence.email,
      latestScore: snapshot?.latestScore ?? null,
      programs: shown.length > 0 ? shown : programs.filter((p) => p.status === "upcoming").slice(0, 2),
    };
  });

  return (
    <Card size="sm" className="bg-house-yellow/5 ring-house-yellow/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-house-yellow/20 text-house-yellow">
              <GavelIcon className="size-3.5" />
            </span>
            Logged-in judges
          </span>
          <Badge variant={rows.length > 0 ? "default" : "secondary"} className="tabular-nums">
            {rows.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No judges logged in. They appear here live as they sign in and start scoring.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li
                key={row.presence.judgeId}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{initials(row.name)}</AvatarFallback>
                    </Avatar>
                    <span
                      className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-house-green"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.presence.programId
                        ? `Scoring ${
                            row.programs.find((p) => p.programId === row.presence.programId)
                              ?.programName ?? "a program"
                          }`
                        : "On judge dashboard"}
                      {" · "}
                      {relativeTime(row.presence.onlineAt)}
                    </p>
                  </div>
                </div>

                {row.latestScore ? (
                  <p className="mt-2 text-sm">
                    Last score:{" "}
                    <span className="font-medium">{row.latestScore.studentName}</span>
                    {" · "}
                    <span className="tabular-nums">{row.latestScore.score}</span>
                    {" · "}
                    <span className="text-muted-foreground">{row.latestScore.programName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({relativeTime(row.latestScore.submittedAt)})
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No scores submitted yet.</p>
                )}

                {row.programs.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-2">
                    {row.programs.map((program) => {
                      const total = program.totalStudents;
                      const pct = total > 0 ? Math.round((program.scoredCount / total) * 100) : 0;
                      return (
                        <li key={program.programId} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="min-w-0 truncate text-sm">
                              {program.programName}
                              <span className="ml-1 text-muted-foreground">
                                ({categoryLabels[program.category] ?? program.category})
                              </span>
                            </p>
                            <ProgramStatusBadge status={program.status} className="shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 min-w-0 flex-1 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-podium-gold"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {program.scoredCount}/{total}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No programs assigned yet.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
