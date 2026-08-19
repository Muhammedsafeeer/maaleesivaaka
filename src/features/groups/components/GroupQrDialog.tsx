"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateGroupQrPdf } from "@/features/groups/lib/generateGroupQrPdf";
import type { Group } from "@/types/group";

/**
 * Printable/shareable QR code for one house — scanning it opens the public,
 * unauthenticated /g/[id] page (src/app/g/[id]/page.tsx) showing that house's live
 * points and recent results. Generated entirely client-side (qrcode package, no
 * network call) from the current origin, so it resolves correctly on preview and
 * production deployments alike without a hardcoded site-URL env var.
 */
export function GroupQrDialog({
  group,
  open,
  onOpenChange,
}: {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const scanUrl =
    open && typeof window !== "undefined" ? `${window.location.origin}/g/${group.id}` : "";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    QRCode.toDataURL(`${window.location.origin}/g/${group.id}`, {
      width: 480,
      margin: 1,
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error("QR code generation failed:", error);
      });

    return () => {
      cancelled = true;
      setQrDataUrl(null);
    };
  }, [open, group.id]);

  async function handleDownloadPdf() {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await generateGroupQrPdf(cardRef.current, `${group.name}-qr.pdf`);
    } catch (error) {
      console.error("generateGroupQrPdf failed:", error);
      toast.error("Could not generate the printable card. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{group.name} — QR code</DialogTitle>
          <DialogDescription>
            Print and share this. Scanning it opens a live, public page with{" "}
            {group.name}&apos;s current points — no login needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="flex w-64 flex-col items-center gap-3 rounded-2xl border border-border bg-white p-6 text-center"
          >
            <p className="font-heading text-lg font-semibold text-black">{group.name}</p>
            {qrDataUrl ? (
              // Captured by html2canvas for the PDF download — a plain <img> avoids
              // next/image's extra wrapper markup showing up in the capture.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt={`QR code linking to ${group.name}'s live points`} className="size-48" />
            ) : (
              <div className="flex size-48 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            <p className="text-xs font-medium text-black/70">Scan for live points</p>
          </div>
        </div>

        <p className="truncate text-center text-xs text-muted-foreground">{scanUrl}</p>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={!qrDataUrl || isDownloading}
            onClick={handleDownloadPdf}
          >
            <Download className="size-4" data-icon="inline-start" />
            {isDownloading ? "Preparing…" : "Download printable card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
