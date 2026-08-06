"use client";

import { transliterateToMalayalam } from "@/lib/malayalam-transliterate";

type MalayalamSuggestionProps = {
  /** The Malayalam-name field's current (possibly Manglish) value. */
  value: string;
  onAccept: (malayalam: string) => void;
};

/**
 * Sits under a "Malayalam name" field. If `value` still has Latin letters the
 * phonetic table (lib/malayalam-transliterate.ts) can convert, offers the result as
 * a one-click suggestion — accepting replaces the field's contents so typing can
 * continue from there. Renders nothing once there's nothing left to transliterate
 * (already-accepted, pasted-in Malayalam, or a value the table can't improve on).
 */
export function MalayalamSuggestion({ value, onAccept }: MalayalamSuggestionProps) {
  const trimmed = value.trim();
  if (!/[a-zA-Z]/.test(trimmed)) return null;

  const suggestion = transliterateToMalayalam(trimmed);
  if (!suggestion || suggestion === trimmed) return null;

  return (
    <button
      type="button"
      lang="ml"
      onClick={() => onAccept(suggestion)}
      className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/50 px-2 py-1 text-left text-sm hover:bg-muted"
    >
      <span className="text-xs text-muted-foreground">Use</span>
      {suggestion}
    </button>
  );
}
