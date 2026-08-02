"use client";

import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES } from "@/constants/programs";
import { searchStudentResultsAction } from "@/features/leaderboard/actions/searchStudentResults.action";
import type { StudentSearchResult } from "@/lib/services/result.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/**
 * D-019 (docs/decisions.md): "Find My Result" — lookup-only, not a browsable list.
 * Lives entirely in the top utility bar: an input with a search button, opening a
 * modal with the match (or "not found") — there's no longer a page section for this at
 * all, so nothing about a student is ever rendered into the page itself, only into a
 * transient dialog the visitor opened themselves by typing a name/roll number they
 * already know. The dialog intentionally uses the plain neutral shadcn theme, not the
 * page's `--stage-*` tokens — Radix's Dialog portals to `document.body`, outside
 * `.audience-shell`'s DOM subtree, so those custom properties wouldn't resolve there
 * anyway.
 */
export function StudentSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<StudentSearchResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    setOpen(true);
    startTransition(async () => {
      const found = await searchStudentResultsAction(trimmed);
      setResults(found);
    });
  }

  return (
    <>
      <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--stage-spotlight-ink-dim)"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            minLength={3}
            placeholder="Find my result…"
            aria-label="Search by name or roll number"
            className="border-(--stage-spotlight-gold)/20 bg-(--stage-spotlight-deep)/40 pl-8 text-(--stage-spotlight-ink) placeholder:text-(--stage-spotlight-ink-dim) focus-visible:border-(--stage-spotlight-gold)/50 focus-visible:ring-(--stage-spotlight-gold)/30"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={query.trim().length < 3}
          className="shrink-0 rounded-full bg-(--stage-spotlight-gold) text-(--stage-spotlight-deep) hover:bg-(--stage-spotlight-gold)/90"
        >
          <Search className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find My Result</DialogTitle>
          </DialogHeader>

          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="flex flex-col gap-4">
              {results.map((student) => (
                <div
                  key={student.studentId}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <div className="bg-muted px-4 py-2.5">
                    <p className="text-sm font-semibold">{student.studentName}</p>
                  </div>
                  <ol className="flex flex-col divide-y divide-border px-4">
                    {student.results.map((result) => (
                      <li key={result.id} className="flex items-center gap-3 py-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[0.65rem] font-bold">
                          {POSITION_LABELS[result.position] ?? `#${result.position}`}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{result.programName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {categoryLabels[result.programCategory] ?? result.programCategory}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                          +{result.points} pts
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="h-1" />
                </div>
              ))}
            </div>
          ) : results ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No student found matching &quot;{query.trim()}&quot;. Check the spelling or
              roll number and try again.
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
