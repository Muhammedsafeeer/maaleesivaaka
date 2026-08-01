import { cn } from "@/lib/utils";
import { CrescentStar } from "@/features/leaderboard/components/MotifIcons";

type OrnateFrameProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Gold double-border panel frame with small crescent-and-star corner accents — the
 * repeating "shrine" treatment every audience panel (now performing, leaderboard,
 * results, winners) sits inside. Ornament stays strictly at the border; the interior is
 * a plain rounded surface so dense tabular content underneath stays scannable.
 */
export function OrnateFrame({ children, className, contentClassName }: OrnateFrameProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-(--stage-gold) bg-(--stage-green-900) p-[3px]",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-[calc(1rem-3px)] border border-(--stage-gold-dim)/60 p-4 sm:p-5",
          contentClassName,
        )}
      >
        {children}
      </div>
      <CrescentStar className="absolute -top-3 -left-3 size-6 text-(--stage-gold)" />
      <CrescentStar className="absolute -top-3 -right-3 size-6 -scale-x-100 text-(--stage-gold)" />
    </div>
  );
}
