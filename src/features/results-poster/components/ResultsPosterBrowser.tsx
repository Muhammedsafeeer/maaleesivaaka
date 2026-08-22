"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/tables/EmptyState";
import { PosterDownloadPortal } from "@/features/results-poster/components/PosterDownloadPortal";
import { ResultPosterTemplate } from "@/features/results-poster/components/ResultPosterTemplate";
import { DynamicResultPosterTemplate } from "@/features/results-poster/components/DynamicResultPosterTemplate";
import { CATEGORY_MALAYALAM_LABELS, type Category } from "@/constants/programs";
import type { PublishedProgramPodiumRow } from "@/lib/services/result.service";
import type { PosterSettings } from "@/lib/services/posterSettings.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Lists every published program with a "Download Poster" button — the admin picks a
 * program, ResultPosterTemplate renders one WhatsApp-sized poster off-screen, and
 * PosterDownloadPortal captures + downloads it as a PNG. One poster at a time (unlike
 * CertificatesBrowser's "print all"), since these are posted to a group chat one
 * program's announcement at a time, not batched.
 */
export function ResultsPosterBrowser({
  rows,
  categoryLabels,
  posterSettingsList,
  defaultSettings,
}: {
  rows: PublishedProgramPodiumRow[];
  categoryLabels: Record<string, string>;
  /** One design per category, plus the "Default" (category: null) fallback. */
  posterSettingsList: PosterSettings[];
  defaultSettings: PosterSettings;
}) {
  const [target, setTarget] = useState<PublishedProgramPodiumRow | null>(null);

  const settingsByCategory = new Map(posterSettingsList.filter((s) => s.category !== null).map((s) => [s.category, s]));

  function settingsFor(programCategory: string): PosterSettings {
    return settingsByCategory.get(programCategory) ?? defaultSettings;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No published programs yet"
        description="Programs appear here once their results have been published — this poster is the public announcement, so it can't exist before that."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Podium</TableHead>
            <TableHead className="text-right">Poster</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((program, index) => (
            <TableRow key={program.programId}>
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">{program.programName}</TableCell>
              <TableCell>{categoryLabels[program.programCategory] ?? program.programCategory}</TableCell>
              <TableCell>
                {program.podium.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No results yet</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {program.podium.map((entry) => (
                      <span
                        key={entry.position}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs"
                      >
                        <Badge className="h-4 px-1 text-[0.65rem]">
                          {POSITION_LABELS[entry.position] ?? entry.position}
                        </Badge>
                        {entry.studentName}
                      </span>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={program.podium.length === 0}
                  onClick={() => setTarget(program)}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download Poster
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PosterDownloadPortal
        open={target !== null}
        onClose={() => setTarget(null)}
        filename={target ? `poster-${slugify(target.programName)}.png` : "poster.png"}
      >
        {target ? (
          settingsFor(target.programCategory).backgroundUrl ? (
            <DynamicResultPosterTemplate
              settings={settingsFor(target.programCategory)}
              programName={target.programName}
              programMalayalamName={target.programMalayalamName}
              categoryLabel={categoryLabels[target.programCategory] ?? target.programCategory}
              categoryMalayalamLabel={
                CATEGORY_MALAYALAM_LABELS[target.programCategory as Category] ?? target.programCategory
              }
              podium={target.podium}
              serialNumber={rows.findIndex((r) => r.programId === target.programId) + 1}
            />
          ) : (
            <ResultPosterTemplate
              programName={target.programName}
              programMalayalamName={target.programMalayalamName}
              categoryLabel={categoryLabels[target.programCategory] ?? target.programCategory}
              categoryMalayalamLabel={
                CATEGORY_MALAYALAM_LABELS[target.programCategory as Category] ?? target.programCategory
              }
              podium={target.podium}
            />
          )
        ) : null}
      </PosterDownloadPortal>
    </>
  );
}
