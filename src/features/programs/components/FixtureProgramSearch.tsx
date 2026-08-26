"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { setProgramStatusAction, searchProgramsAction } from "@/features/programs/actions/fixture.actions";
import { publishProgramAction } from "@/features/programs/actions/result.actions";
import { CATEGORIES, STAGE_TYPES, PROGRAM_STATUSES, type ProgramStatus } from "@/constants/programs";
import type { ProgramSearchResult } from "@/lib/services/fixture.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

// 'published' is deliberately excluded — same reasoning as FixtureList.tsx's own
// overridableStatuses: that transition stays behind the "Publish" gate (requires
// calculated results), not this dropdown.
const overridableStatuses = PROGRAM_STATUSES.filter((s) => s.value !== "published");

const DEBOUNCE_MS = 250;

/**
 * One search result row — status is directly editable here (a Select, same control
 * FixtureRow uses), not just a read-only badge, so finding a program via global search
 * is actually enough to change its status: previously this row only linked to the
 * program's detail page, which has no status control of its own at all, so a program
 * found on a stage other than the one currently selected had NO way to change status
 * without first switching tabs. `onStatusChange` patches the row in the parent's
 * `results` state so the dropdown reflects the change immediately, without a full
 * re-search.
 */
function SearchResultRow({
  program,
  onStatusChange,
  onNavigate,
}: {
  program: ProgramSearchResult;
  onStatusChange: (id: string, status: ProgramStatus) => void;
  onNavigate: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isPublishing, startPublish] = useTransition();

  function handleStatusChange(status: Exclude<ProgramStatus, "published">) {
    if (status === program.status) return;

    startTransition(async () => {
      const result = await setProgramStatusAction(program.id, status);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onStatusChange(program.id, status);
    });
  }

  function handlePublish() {
    startPublish(async () => {
      const result = await publishProgramAction(program.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onStatusChange(program.id, "published");
      toast.success(`${program.name} published — visible to the audience now.`);
    });
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2.5 text-sm">
      <Link
        href={`/admin/programs/${program.id}`}
        onClick={onNavigate}
        className="min-w-0 flex-1 hover:underline"
      >
        <p className="truncate font-medium">
          {program.name}{" "}
          <span className="font-normal text-muted-foreground">
            ({categoryLabels[program.category] ?? program.category})
          </span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {stageLabels[program.stageType] ?? program.stageType}
          {program.serialNumber !== null ? ` · #${program.serialNumber}` : ""}
        </p>
      </Link>

      {program.status === "published" ? (
        <ProgramStatusBadge status={program.status} className="shrink-0" />
      ) : (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Select
            value={program.status}
            onValueChange={(value) => handleStatusChange(value as Exclude<ProgramStatus, "published">)}
            disabled={isPending}
          >
            <SelectTrigger aria-label={`Status for ${program.name}`} className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {overridableStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {program.status === "completed" ? (
            <Button size="sm" className="h-7 w-32" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing…" : "Publish"}
            </Button>
          ) : null}
        </div>
      )}
    </li>
  );
}

/**
 * The Fixture page's own FixtureList/tabs only ever show one stage at a time (the
 * `?stage=` in the URL) — this search is deliberately GLOBAL across both stages, so an
 * admin looking for a specific program doesn't have to guess or flip tabs first.
 * Debounced free-text match against the name (either language, see
 * fixture.service.ts's searchPrograms), results shown in a dropdown where status is
 * directly editable per row (SearchResultRow) as well as linking to that program's
 * detail page for roster/judges management.
 */
export function FixtureProgramSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProgramSearchResult[] | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      setResults(null);
      startTransition(async () => {
        const found = await searchProgramsAction(trimmed);
        setResults(found);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleStatusChange(id: string, status: ProgramStatus) {
    setResults((current) => current?.map((p) => (p.id === id ? { ...p, status } : p)) ?? current);
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search any program, any stage…"
        aria-label="Search programs across all stages"
        className="h-9 pl-8"
      />

      {showDropdown ? (
        <div className="absolute top-full left-0 z-20 mt-1 max-h-96 w-full min-w-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {isPending && !results ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Searching…
            </div>
          ) : results && results.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {results.map((program) => (
                <SearchResultRow
                  key={program.id}
                  program={program}
                  onStatusChange={handleStatusChange}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          ) : results ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No program found matching &quot;{query.trim()}&quot;.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
