"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { searchProgramsAction } from "@/features/programs/actions/fixture.actions";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import type { ProgramSearchResult } from "@/lib/services/fixture.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

const DEBOUNCE_MS = 250;

/**
 * The Fixture page's own FixtureList/tabs only ever show one stage at a time (the
 * `?stage=` in the URL) — this search is deliberately GLOBAL across both stages, so an
 * admin looking for a specific program doesn't have to guess or flip tabs first.
 * Debounced free-text match against the name (either language, see
 * fixture.service.ts's searchPrograms), results shown in a dropdown with each result's
 * own stage/status/serial so it's clear where to find it, linking straight to that
 * program's detail page.
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
        <div className="absolute top-full left-0 z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {isPending && !results ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Searching…
            </div>
          ) : results && results.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {results.map((program) => (
                <li key={program.id}>
                  <Link
                    href={`/admin/programs/${program.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{program.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {categoryLabels[program.category] ?? program.category} ·{" "}
                        {stageLabels[program.stageType] ?? program.stageType}
                        {program.serialNumber !== null ? ` · #${program.serialNumber}` : ""}
                      </p>
                    </div>
                    <ProgramStatusBadge status={program.status} className="shrink-0" />
                  </Link>
                </li>
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
