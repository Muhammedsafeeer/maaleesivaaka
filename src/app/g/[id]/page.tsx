import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ListOrdered } from "lucide-react";
import { listGroupLeaderboard, listGroupPublicResults } from "@/lib/services/leaderboard.service";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { OrnateFrame } from "@/features/leaderboard/components/OrnateFrame";
import { SectionHeading } from "@/features/leaderboard/components/SectionHeading";
import { TrophyCup } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES } from "@/constants/programs";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const RANK_TONES = { 1: "gold", 2: "silver", 3: "bronze" } as const;

type GroupPublicPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: GroupPublicPageProps): Promise<Metadata> {
  const { id } = await params;
  const groups = await listGroupLeaderboard();
  const group = groups.find((g) => g.id === id);
  return { title: group ? `${group.name} — Live Points` : "House not found" };
}

/**
 * QR-scan destination for one house (admin/groups' printable QR code): a public,
 * unauthenticated, house-only page — no student names, same D-017 contract as every
 * other public surface, just scoped to one house instead of the full audience page.
 * Realtime via the same results-table listener the leaderboard/audience pages already
 * use (D-016) — no polling, updates live as scores come in.
 */
export default async function GroupPublicPage({ params }: GroupPublicPageProps) {
  const { id } = await params;
  const [groups, results] = await Promise.all([
    listGroupLeaderboard(),
    listGroupPublicResults(id),
  ]);

  const group = groups.find((g) => g.id === id);

  if (!group) {
    notFound();
  }

  const tone = RANK_TONES[group.rank as 1 | 2 | 3] ?? "bronze";

  return (
    <div className="relative mx-auto flex min-h-full max-w-lg flex-col gap-6 overflow-hidden p-4 sm:p-6">
      <RealtimeLeaderboardListener />

      <OrnateFrame surface="spotlight">
        <div className="flex flex-col items-center gap-3 pt-8 pb-2 text-center">
          <TrophyCup tone={tone} className="size-20 drop-shadow-md" />
          <PhotoThumbnail
            url={group.photo_url}
            alt={`${group.name} photo`}
            className="size-20 rounded-full"
          />
          <h1 className="font-[family-name:var(--font-audience-display)] text-2xl font-bold text-(--stage-spotlight-ink)">
            {group.name}
          </h1>
          <span className="w-fit rounded-full bg-(--stage-spotlight-gold)/20 px-3 py-1 text-xs font-bold tracking-wide text-(--stage-spotlight-gold) uppercase">
            {POSITION_LABELS[group.rank] ?? `#${group.rank}`} place
          </span>
          <p className="font-mono text-4xl font-extrabold tabular-nums text-(--stage-spotlight-gold)">
            {group.total_points}
          </p>
          <p className="text-xs font-semibold tracking-widest text-(--stage-spotlight-ink-dim) uppercase">
            Total points
          </p>
        </div>
      </OrnateFrame>

      <OrnateFrame tint="sapphire">
        <SectionHeading icon={<ListOrdered />} kicker="Recent" title="Results" tint="sapphire" size="sm" />
        {results.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No published results for this house yet.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {results.map((result) => (
              <li key={result.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--section-sapphire)/10 text-xs font-bold text-(--section-sapphire)">
                  {POSITION_LABELS[result.position] ?? `#${result.position}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{result.programName}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryLabels[result.programCategory] ?? result.programCategory}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                  {result.points} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </OrnateFrame>

      <Link
        href="/audience"
        className="mx-auto flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:underline"
      >
        <Trophy className="size-3.5" aria-hidden="true" />
        See the full festival standings
      </Link>
    </div>
  );
}
