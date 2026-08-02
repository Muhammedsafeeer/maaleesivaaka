import { cn } from "@/lib/utils";
import type { FrameTint } from "@/features/leaderboard/components/OrnateFrame";

const TINT_ICON_BADGE: Record<FrameTint, string> = {
  gold: "bg-(--stage-gold)/12 text-(--stage-gold-bright)",
  emerald: "bg-(--section-emerald)/12 text-(--section-emerald)",
  sapphire: "bg-(--section-sapphire)/12 text-(--section-sapphire)",
  ruby: "bg-(--section-ruby)/12 text-(--section-ruby)",
  amber: "bg-(--section-amber)/12 text-(--section-amber)",
};

const TINT_TEXT: Record<FrameTint, string> = {
  gold: "text-(--stage-gold-bright)",
  emerald: "text-(--section-emerald)",
  sapphire: "text-(--section-sapphire)",
  ruby: "text-(--section-ruby)",
  amber: "text-(--section-amber)",
};

const TINT_KICKER: Record<FrameTint, string> = {
  gold: "text-(--stage-gold)/70",
  emerald: "text-(--section-emerald)/70",
  sapphire: "text-(--section-sapphire)/70",
  ruby: "text-(--section-ruby)/70",
  amber: "text-(--section-amber)/70",
};

type SectionHeadingProps = {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  tint: FrameTint | "spotlight";
  align?: "left" | "center";
  /** "default" for a full section header, "sm" for the denser cards inside the
   * three-column data grid (audience/page.tsx's `#full-standings` section). */
  size?: "default" | "sm";
  className?: string;
};

/**
 * The consistent "icon badge + kicker + title" heading pattern used at the top of
 * every audience section — one shared component instead of five near-identical inline
 * headings, so every panel reads as deliberately designed rather than a copy-pasted
 * box that only differs by colour. `spotlight` uses the dark surface's own gold/ink
 * tokens instead of a light-ground tint.
 */
export function SectionHeading({
  icon,
  kicker,
  title,
  tint,
  align = "left",
  size = "default",
  className,
}: SectionHeadingProps) {
  const isSpotlight = tint === "spotlight";
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        isSm ? "mb-3 gap-2" : "mb-5",
        align === "center" && "flex-col text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          isSm ? "size-8 [&_svg]:size-4" : "size-10 [&_svg]:size-5",
          isSpotlight
            ? "bg-(--stage-spotlight-gold)/15 text-(--stage-spotlight-gold)"
            : TINT_ICON_BADGE[tint as FrameTint],
        )}
      >
        {icon}
      </span>
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {isSm ? null : (
          <p
            className={cn(
              "text-[0.65rem] font-bold tracking-[0.15em] uppercase",
              isSpotlight ? "text-(--stage-spotlight-gold)/60" : TINT_KICKER[tint as FrameTint],
            )}
          >
            {kicker}
          </p>
        )}
        <h2
          className={cn(
            "font-[family-name:var(--font-audience-display)] font-bold",
            isSm ? "text-base" : "text-xl sm:text-2xl",
            isSpotlight ? "text-(--stage-spotlight-gold)" : TINT_TEXT[tint as FrameTint],
          )}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}
