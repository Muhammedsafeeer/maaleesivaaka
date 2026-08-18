"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGE_TYPES } from "@/constants/programs";
import type { Program } from "@/types/program";

const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

export function StudentProgramPicker({
  programs,
  selectedIds,
  onChange,
  error,
}: {
  programs: Program[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? programs.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : programs;

  // Selected programs that are still in the full list but filtered out by search
  const selectedButHidden = programs.filter(
    (p) => selectedIds.includes(p.id) && !filtered.includes(p),
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Programs</Label>
      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No programs in this category yet. You can still create the student and assign
          a program later.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Only programs in this student&apos;s category are listed. This step is optional,
            and you can assign programs later.
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search programs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
              aria-label="Search programs"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-sm text-muted-foreground">
                No programs match &ldquo;{search}&rdquo;
              </p>
            ) : (
              filtered.map((program) => {
                const checked = selectedIds.includes(program.id);
                return (
                  <label
                    key={program.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        if (value === true) {
                          onChange([...selectedIds, program.id]);
                          return;
                        }
                        onChange(selectedIds.filter((id) => id !== program.id));
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate">{program.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stageLabels[program.stage_type]}
                    </span>
                  </label>
                );
              })
            )}
            {selectedButHidden.length > 0 && (
              <>
                <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
                  Selected (hidden by search)
                </div>
                {selectedButHidden.map((program) => (
                  <label
                    key={program.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 opacity-60 hover:bg-muted/60"
                  >
                    <Checkbox
                      checked
                      onCheckedChange={() => {
                        onChange(selectedIds.filter((id) => id !== program.id));
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate">{program.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stageLabels[program.stage_type]}
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>
          {selectedIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} {selectedIds.length === 1 ? "program" : "programs"} selected
            </p>
          )}
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
