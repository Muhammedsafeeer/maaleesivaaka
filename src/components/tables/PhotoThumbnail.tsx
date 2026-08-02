import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PhotoThumbnailProps = {
  url: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Shared small-photo treatment for table rows and the dashboard leaderboard. */
export function PhotoThumbnail({ url, alt, className, style }: PhotoThumbnailProps) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
      style={style}
    >
      {url ? (
        // External Storage URL — see PhotoUpload.tsx for why this isn't next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
