import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type PhotoThumbnailProps = {
  url: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Hard pixel box — preferred on /tv where CSS variables / Tailwind may not apply. */
  sizePx?: number;
};

/** Shared small-photo treatment for table rows and the dashboard leaderboard. */
export function PhotoThumbnail({ url, alt, className, style, sizePx }: PhotoThumbnailProps) {
  const box: CSSProperties | undefined = sizePx
    ? {
        width: sizePx,
        height: sizePx,
        maxWidth: sizePx,
        maxHeight: sizePx,
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }
    : style;

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
      style={box}
    >
      {url ? (
        // External Storage URL — see PhotoUpload.tsx for why this isn't next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          width={sizePx ?? 32}
          height={sizePx ?? 32}
          className="size-full object-cover"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <ImageIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
