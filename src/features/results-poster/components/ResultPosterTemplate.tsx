import { Playfair_Display, Noto_Sans_Malayalam } from "next/font/google";
import { UserRound } from "lucide-react";

/**
 * Self-hosted here rather than reused from CertificateTemplate — same reasoning as
 * that component's own displayFont: this poster renders identically regardless of
 * which route triggers it, without depending on a layout that happens to already
 * have the font loaded.
 */
const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  style: ["normal", "italic"],
});

// Same reasoning as CertificateTemplate's malayalamFont: Playfair Display has no
// Malayalam glyphs, so studentName's malayalam_name counterpart needs its own font
// rather than depending on whatever's installed on the machine downloading the poster.
const malayalamFont = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["600"] });

// One slot per numbered badge row baked into public/poster.jpg, measured off that
// image — see the .poster-* rules in globals.css for the shared field styling these
// top offsets plug into. Row 4+ (position > 3) never occurs — results.actions caps a
// podium at three — so only three slots exist.
const ROW_CENTER_Y: Record<number, number> = { 1: 332, 2: 395, 3: 458 };

type PodiumEntry = {
  position: number;
  studentName: string;
  studentMalayalamName: string | null;
  groupName: string | null;
  groupMalayalamName: string | null;
  photoUrl: string | null;
};

type ResultPosterTemplateProps = {
  programName: string;
  programMalayalamName: string | null;
  categoryLabel: string;
  categoryMalayalamLabel: string;
  podium: PodiumEntry[];
};

/**
 * One WhatsApp-shareable poster for one published program's podium — distinct from
 * CertificateTemplate (a per-student keepsake overlaid on the fixed certificate.jpeg
 * design), but built the same way as of v3: overlaid on the fixed public/poster.jpg
 * artwork (the mosque's own Noorul Huda Madrassa / Maalee Sivaa Ka design, with its
 * position badges pre-drawn) rather than a hand-drawn Tailwind frame, now that that
 * artwork exists to align overlays against. Each row gets a circular student photo
 * next to the artwork's own numbered badge, with the name/group to its right; the
 * program name sits in the open box near the top.
 */
export function ResultPosterTemplate({
  programName,
  programMalayalamName,
  categoryLabel,
  categoryMalayalamLabel,
  podium,
}: ResultPosterTemplateProps) {
  return (
    <div className={`poster-page ${displayFont.className}`}>
      <div className="poster-frame">
        <div className="poster-field poster-header">
          <p
            className={`poster-category-malayalam ${malayalamFont.className}`}
            title={categoryMalayalamLabel}
          >
            {categoryMalayalamLabel}
          </p>
          <p
            className={`poster-program-name-malayalam ${malayalamFont.className}`}
            title={programMalayalamName ?? programName}
          >
            {programMalayalamName ?? programName}
          </p>
        </div>

        {podium.length === 0 ? (
          <p className="poster-empty-note">Results coming soon</p>
        ) : (
          podium.map((entry) => {
            const centerY = ROW_CENTER_Y[entry.position];
            if (centerY === undefined) return null;

            return (
              <div key={entry.position}>
                <div className="poster-photo" style={{ top: centerY }}>
                  {entry.photoUrl ? (
                    // External Storage URL — see PhotoUpload.tsx for why this isn't
                    // next/image. crossOrigin is for generatePosterImage.ts's
                    // html2canvas capture, same reasoning as CertificateTemplate's
                    // cert-photo — without it a cross-origin image taints the canvas.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.photoUrl} alt={entry.studentName} crossOrigin="anonymous" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <UserRound className="size-10 opacity-40" style={{ color: "#123a26" }} />
                    </div>
                  )}
                </div>

                <div className="poster-details" style={{ top: centerY }}>
                  <p className="poster-name" title={entry.studentName}>
                    {entry.studentName}
                  </p>
                  {entry.studentMalayalamName ? (
                    <p
                      className={`poster-name-malayalam ${malayalamFont.className}`}
                      title={entry.studentMalayalamName}
                    >
                      {entry.studentMalayalamName}
                    </p>
                  ) : null}
                  {entry.groupName ? (
                    <p
                      className="poster-group"
                      title={`${entry.groupName} Group`}
                    >
                      {entry.groupName}
                      {entry.groupMalayalamName ? ` (${entry.groupMalayalamName})` : ""} Group ·{" "}
                      {categoryLabel}
                    </p>
                  ) : (
                    <p className="poster-group">{categoryLabel}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
