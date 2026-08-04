import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// .certificate-page (src/app/globals.css) is 297×198mm — matches the 1536×1024
// certificate.jpeg exactly (3:2) — so the PDF page is sized the same way rather than
// a standard paper size, the same reasoning as the CSS's own @page size before this
// replaced window.print() entirely.
const PAGE_WIDTH_MM = 297;
const PAGE_HEIGHT_MM = 198;

// html2canvas renders the DOM at its CSS pixel size (297mm @ 96dpi ≈ 1123px) times
// this scale factor. 3x lands print output around 300dpi for the vector text/icons
// overlaid on the template — the template photo itself is a fixed 1536×1024 source
// and won't gain real detail past that, but the text is what benefits from going this
// high.
const CAPTURE_SCALE = 3;

/**
 * Renders each `.certificate-page` element to a canvas (html2canvas-pro — the "-pro"
 * fork, not the original html2canvas, because it supports the oklch()/lab() color
 * functions Tailwind v4's default theme uses; the original throws on those) and
 * assembles the results into one PDF, one page per element, then triggers a browser
 * download. Runs entirely in JS — no window.print() / browser print dialog / @page
 * CSS involved — specifically because mobile Safari and Chrome apply print CSS
 * inconsistently (custom @page sizes and background-image are both unreliable there),
 * which made the certificate print correctly on desktop but come out wrong on a
 * phone. A canvas screenshot renders identically regardless of device.
 */
export async function generateCertificatePdf(
  pageElements: HTMLElement[],
  filename: string,
): Promise<void> {
  if (pageElements.length === 0) {
    return;
  }

  // Custom web font (Playfair Display, next/font-hosted) and the Supabase-hosted
  // photo/seal/signature images must actually be loaded before the canvas capture —
  // otherwise html2canvas either falls back to a system font for the former or
  // captures a blank box for the latter.
  await document.fonts.ready;
  await Promise.all(pageElements.map(waitForImages));

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
  });

  for (let i = 0; i < pageElements.length; i++) {
    const canvas = await html2canvas(pageElements[i], {
      scale: CAPTURE_SCALE,
      useCORS: true,
      backgroundColor: "#fdf8ec",
    });
    const imageData = canvas.toDataURL("image/jpeg", 0.92);

    if (i > 0) {
      pdf.addPage([PAGE_WIDTH_MM, PAGE_HEIGHT_MM], "landscape");
    }
    pdf.addImage(imageData, "JPEG", 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
  }

  pdf.save(filename);
}

function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        // A broken/unreachable image shouldn't hang the whole PDF — html2canvas
        // just renders that one spot blank, same as it would for a slow image
        // that happened to finish loading in time.
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  ).then(() => undefined);
}
