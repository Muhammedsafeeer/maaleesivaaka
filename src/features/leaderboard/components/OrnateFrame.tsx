import { cn } from "@/lib/utils";

export type FrameTint = "gold" | "emerald" | "sapphire" | "ruby" | "amber";
export type FrameSurface = "light" | "spotlight";

const TINT_BG: Record<FrameTint, string> = {
  gold: "bg-(--stage-gold)/[0.05]",
  emerald: "bg-(--section-emerald)/[0.05]",
  sapphire: "bg-(--section-sapphire)/[0.05]",
  ruby: "bg-(--section-ruby)/[0.05]",
  amber: "bg-(--section-amber)/[0.05]",
};

const TINT_ACCENT_BAR: Record<FrameTint, string> = {
  gold: "from-(--stage-gold) via-(--stage-gold-bright) to-(--stage-gold)",
  emerald: "from-(--section-emerald) via-(--section-emerald)/60 to-(--section-emerald)",
  sapphire: "from-(--section-sapphire) via-(--section-sapphire)/60 to-(--section-sapphire)",
  ruby: "from-(--section-ruby) via-(--section-ruby)/60 to-(--section-ruby)",
  amber: "from-(--section-amber) via-(--section-amber)/60 to-(--section-amber)",
};

const TINT_GLOW: Record<FrameTint, string> = {
  gold: "bg-(--stage-gold)",
  emerald: "bg-(--section-emerald)",
  sapphire: "bg-(--section-sapphire)",
  ruby: "bg-(--section-ruby)",
  amber: "bg-(--section-amber)",
};

type OrnateFrameProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** A very soft background wash (5% opacity) in one of the section-identity colours,
   * a thin gradient accent bar along the top edge, and a soft blurred glow in the far
   * corner — enough for each panel to feel individually designed rather than an
   * identical box in five colours. Omit for no tint treatment at all. */
  tint?: FrameTint;
  /** "light" (default) — soft-tinted or plain, per `tint`. "spotlight" is the one
   * deliberately dark exception (Leading Houses), matching the reference's own dark
   * "Leading Districts" treatment — a caller using it is responsible for giving its own
   * content the matching `--stage-spotlight-ink*` text treatment. */
  surface?: FrameSurface;
};

/**
 * Panel wrapper for every audience section — generously rounded, generously padded.
 * `spotlight` swaps in the dark `--stage-spotlight` → `--stage-spotlight-deep` gradient
 * with its own shadow; a `tint` gets a soft colour wash, a top accent bar, and a
 * corner glow so panels read as distinct designed surfaces, not repeated boxes.
 */
export function OrnateFrame({ children, className, id, tint, surface = "light" }: OrnateFrameProps) {
  return (
    <div
      id={id}
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 sm:p-7",
        surface === "spotlight"
          ? "bg-gradient-to-br from-(--stage-spotlight) to-(--stage-spotlight-deep) shadow-lg shadow-(--stage-spotlight)/20"
          : tint
            ? cn(TINT_BG[tint], "shadow-sm")
            : "",
        className,
      )}
    >
      {tint && surface !== "spotlight" ? (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
              TINT_ACCENT_BAR[tint],
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-[0.08] blur-2xl",
              TINT_GLOW[tint],
            )}
          />
        </>
      ) : null}
      {surface === "spotlight" ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute top-[8%] left-[10%] size-1.5 rounded-full bg-(--stage-spotlight-gold) opacity-40" />
          <span className="absolute top-[18%] left-[85%] size-1 rounded-full bg-(--stage-spotlight-gold) opacity-50" />
          <span className="absolute top-[6%] left-[55%] size-1 rounded-full bg-(--stage-spotlight-gold) opacity-30" />
          <span className="absolute top-[30%] left-[5%] size-1 rounded-full bg-(--stage-spotlight-gold) opacity-30" />
          <span className="absolute top-[12%] left-[70%] size-1.5 rounded-full bg-(--stage-spotlight-gold) opacity-25" />
          <span className="absolute top-[85%] left-[92%] size-1 rounded-full bg-(--stage-spotlight-gold) opacity-30" />
          <span className="absolute top-[90%] left-[8%] size-1.5 rounded-full bg-(--stage-spotlight-gold) opacity-25" />
        </span>
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}
