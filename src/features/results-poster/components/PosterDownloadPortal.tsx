"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { generatePosterImage } from "@/features/results-poster/lib/generatePosterImage";

/**
 * Same off-screen-capture-then-download shape as CertificatePrintPortal (portal to
 * #certificate-print-root — reused rather than a second identical rule, since both
 * only need "laid out but not visible to the user" and there's nothing
 * certificate-specific left in that CSS after the html2canvas rewrite), but for a
 * single poster image instead of a multi-page PDF.
 */
export function PosterDownloadPortal({
  open,
  onClose,
  filename,
  children,
}: {
  open: boolean;
  onClose: () => void;
  filename: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      setError(null);
      // A tick so the portaled DOM has actually mounted before querySelector runs.
      await new Promise((resolve) => window.setTimeout(resolve, 50));
      if (cancelled) return;

      const page = containerRef.current?.querySelector<HTMLElement>(".poster-page");
      if (!page) return;

      try {
        await generatePosterImage(page, filename);
      } catch (err) {
        console.error("generatePosterImage failed:", err);
        if (!cancelled) {
          setError("Could not generate the poster image. Please try again.");
          return;
        }
      }

      if (!cancelled) {
        onClose();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, onClose, filename]);

  if (!open) return null;

  return createPortal(
    <>
      <div id="certificate-print-root" ref={containerRef}>
        {children}
      </div>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4"
              onClick={onClose}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Generating poster…</p>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}
