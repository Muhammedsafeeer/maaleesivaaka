"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Portals its children (one or more CertificateTemplate pages) to document.body and
 * drives window.print() while open. The app shell (#app-root, src/app/layout.tsx) is
 * hidden via the "printing-certificate" body class (src/app/globals.css) for the
 * duration, so only the certificate pages reach paper — everything else (dialogs,
 * nav, the rest of the page) stays in the DOM but invisible to the print engine.
 * Closes itself on the browser's "afterprint" event, which fires whether the user
 * actually printed or hit cancel.
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
  useEffect(() => {
    if (!open) return;

    document.body.classList.add("printing-certificate");
    const handleAfterPrint = () => onClose();
    window.addEventListener("afterprint", handleAfterPrint);
    // A tick so the portaled content (and its banner image) is painted before the
    // print engine captures the page.
    const timer = window.setTimeout(() => window.print(), 80);

    return () => {
      document.body.classList.remove("printing-certificate");
      window.removeEventListener("afterprint", handleAfterPrint);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(<div id="certificate-print-root">{children}</div>, document.body);
}
