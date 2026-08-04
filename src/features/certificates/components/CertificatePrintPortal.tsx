"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { generateCertificatePdf } from "@/features/certificates/lib/generateCertificatePdf";

/**
 * Portals its children (one or more CertificateTemplate pages) to document.body inside
 * #certificate-print-root (src/app/globals.css — positioned off-screen, not
 * display:none, so it's still laid out for html2canvas to capture), then generates and
 * downloads a PDF via generateCertificatePdf.ts while showing a "Generating…" overlay.
 * Not window.print() — that relied on mobile Safari/Chrome applying the same @page
 * size and background-image handling as desktop, which they don't, so certificates
 * printed correctly from a laptop but came out wrong from a phone. A canvas-captured
 * PDF looks the same everywhere it's opened, regardless of what generated it.
 * Self-closes once the download has been triggered (or the capture failed).
 */
export function CertificatePrintPortal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      // Nested inside the IIFE rather than at the top of the effect body — a
      // setState call directly in an effect's own body applies before the DOM this
      // effect is meant to synchronize with has actually changed, which is what
      // react-hooks/set-state-in-effect warns against; this is the effect
      // synchronizing with a fresh async attempt starting, not that.
      setError(null);
      // A tick so the portaled DOM (images, fonts) has actually mounted before
      // querySelectorAll below runs against it.
      await new Promise((resolve) => window.setTimeout(resolve, 50));
      if (cancelled) return;

      const pages = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(".certificate-page") ?? [],
      );
      if (pages.length === 0) return;

      try {
        await generateCertificatePdf(pages, "certificates.pdf");
      } catch (err) {
        console.error("generateCertificatePdf failed:", err);
        if (!cancelled) {
          setError("Could not generate the PDF. Please try again.");
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
  }, [open, onClose]);

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
            <p className="text-sm text-muted-foreground">Generating certificate PDF…</p>
          </>
        )}
      </div>
    </>,
    document.body,
  );
}
