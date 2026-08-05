import html2canvas from "html2canvas-pro";

// 1080 CSS px (.poster-page, src/app/globals.css) × 2 = 2160px output — crisp before
// WhatsApp's own re-compression, same reasoning as generateCertificatePdf.ts's
// CAPTURE_SCALE.
const CAPTURE_SCALE = 2;

/**
 * Captures one `.poster-page` element (ResultPosterTemplate) with html2canvas-pro
 * (not the original html2canvas — same reasoning as generateCertificatePdf.ts: it
 * doesn't support the oklch()/lab() color functions Tailwind v4's default theme
 * uses) and triggers a PNG download. A direct image, not a PDF like the certificate
 * pipeline — WhatsApp previews an image inline in a chat; a PDF would just land as a
 * document attachment nobody opens.
 */
export async function generatePosterImage(pageElement: HTMLElement, filename: string): Promise<void> {
  await document.fonts.ready;
  await waitForImages(pageElement);

  const canvas = await html2canvas(pageElement, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    backgroundColor: "#fdf8ec",
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Could not render the poster image.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
