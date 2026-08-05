import { Playfair_Display } from "next/font/google";
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

const POSITION_SUFFIXES: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

// One slot per podium box baked into public/poster.png, measured off that image —
// see the .poster-* rules in globals.css for the shared field styling these top
// offsets plug into. Row 4+ (position > 3) never occurs — results.actions caps a
// podium at three — so only three slots exist.
const ROW_CENTER_Y: Record<number, number> = { 1: 519, 2: 686, 3: 854 };

type PodiumEntry = {
  position: number;
  studentName: string;
  groupName: string | null;
  photoUrl: string | null;
};

type ResultPosterTemplateProps = {
  programName: string;
  categoryLabel: string;
  podium: PodiumEntry[];
};

/**
 * One WhatsApp-shareable poster for one published program's podium — distinct from
 * CertificateTemplate (a per-student keepsake overlaid on the fixed certificate.jpeg
 * design), but built the same way as of v2: overlaid on the fixed public/poster.png
 * artwork (the mosque's own Noorul Huda Madrassa / Maalee Sivaa Ka design — emblem,
 * corner ribbons, lantern, three blank ornate boxes) rather than a hand-drawn
 * Tailwind frame, now that that artwork exists to align overlays against. Each box
 * gets a circular student photo on the left, a small gold position badge, and the
 * name/group to its right; the program name sits in the gap directly under the
 * "MAALEE SIVAA KA" banner.
 */
export function ResultPosterTemplate({
  programName,
  categoryLabel,
  podium,
}: ResultPosterTemplateProps) {
  return (
    <div className={`poster-page ${displayFont.className}`}>
      <div className="poster-frame">
        <p className="poster-field poster-program-name" title={programName}>
          {programName}
        </p>

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

                <div className="poster-badge" style={{ top: centerY }}>
                  {entry.position}
                  <span style={{ fontSize: 10, verticalAlign: "super" }}>
                    {POSITION_SUFFIXES[entry.position] ?? "th"}
                  </span>
                </div>

                <div className="poster-details" style={{ top: centerY }}>
                  <p className="poster-name" title={entry.studentName}>
                    {entry.studentName}
                  </p>
                  {entry.groupName ? (
                    <p className="poster-group" title={`${entry.groupName} Group`}>
                      {entry.groupName} Group · {categoryLabel}
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
