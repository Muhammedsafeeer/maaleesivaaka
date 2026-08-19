import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// A postcard-sized portrait card — big enough to read the QR from a short distance
// once printed and pinned up, small enough to not need special paper stock.
const PAGE_WIDTH_MM = 100;
const PAGE_HEIGHT_MM = 150;

// Same reasoning as generateCertificatePdf.ts's CAPTURE_SCALE — renders the DOM at
// roughly 300dpi rather than screen resolution, so the QR code itself stays crisp and
// actually scannable once printed (a low-res capture can blur the QR's fine modules
// enough that phone cameras fail to lock onto it).
const CAPTURE_SCALE = 3;

/**
 * Renders one `.group-qr-card` element to a canvas (html2canvas-pro, not the original
 * html2canvas — see generateCertificatePdf.ts's comment on why: Tailwind v4's oklch()
 * colors throw on the unforked library) and saves it as a single-page PDF. Same
 * canvas-capture approach as certificates, for the same reason: window.print()'s
 * @page sizing is unreliable across devices, a captured image isn't.
 */
export async function generateGroupQrPdf(cardElement: HTMLElement, filename: string): Promise<void> {
  await document.fonts.ready;
  await waitForImages(cardElement);

  const canvas = await html2canvas(cardElement, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const imageData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
  });
  pdf.addImage(imageData, "PNG", 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
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
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  ).then(() => undefined);
}
