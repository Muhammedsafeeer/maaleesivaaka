import { Playfair_Display } from "next/font/google";

/**
 * Self-hosted here (rather than reusing the audience layout's --font-audience-display)
 * so CertificateTemplate looks the same regardless of which route triggers it —
 * /admin/certificates and the program detail page's PrintCertificatesDialog never load
 * the audience layout at all.
 */
const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  style: ["normal", "italic"],
});

const POSITION_SUFFIXES: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd} / ${mm} / ${date.getFullYear()}`;
}

type CertificateTemplateProps = {
  studentName: string;
  rollNumber?: string | null;
  className?: string | null;
  houseName?: string | null;
  programName: string;
  categoryLabel: string;
  position: number;
  points: number;
  signatoryName?: string | null;
  sealUrl?: string | null;
  signatureUrl?: string | null;
  photoUrl?: string | null;
  /**
   * "position" (default) is the existing podium design — the ribbon shows the
   * numeric position ("1st"/"2nd"/"3rd"). "participation" is for every scored
   * student regardless of position (confirmed with the user: a podium finisher can
   * hold both) — the ribbon reads "PARTICIPATE" instead, and points are omitted
   * from the program line since POINTS_FOR_UNPLACED is 0 for most of this
   * audience and printing "0 pts" would read as a mistake rather than a design
   * choice.
   */
  certificateType?: "position" | "participation";
};

/**
 * One printable certificate page, overlaid on the fixed public/certificate.jpeg design
 * (Noorul Huda Madrassa / Maalee Sivaa Ka) — positioning: .cert-* in src/app/globals.css.
 * The image is 1536×1024 (3:2) and .certificate-page is sized to that exact ratio in mm
 * (297×198, the widest that still fits on A4 landscape), so every overlay below is
 * positioned in mm too rather than %, keeping the two in a single fixed, print-accurate
 * coordinate space instead of two unit systems that could drift apart.
 *
 * rollNumber/className/houseName/photoUrl are optional because the audience "Find My
 * Result" search (D-019, docs/decisions.md) deliberately never returns them — only a
 * student's own name and result — so a certificate printed from there leaves those
 * fields blank rather than showing "—" or a placeholder photo. signatoryName/sealUrl/
 * signatureUrl come from certificate_settings (admin-configured in /admin/settings,
 * CertificateSettingsForm); all three are optional for the same reason — nothing here
 * should block printing a certificate before an admin has gotten around to uploading a
 * seal.
 */
export function CertificateTemplate({
  studentName,
  rollNumber,
  className,
  houseName,
  programName,
  categoryLabel,
  position,
  points,
  signatoryName,
  sealUrl,
  signatureUrl,
  photoUrl,
  certificateType = "position",
}: CertificateTemplateProps) {
  const isParticipation = certificateType === "participation";
  const positionSuffix = POSITION_SUFFIXES[position] ?? "th";
  const programLine = isParticipation
    ? `${programName}${houseName ? ` · ${houseName} House` : ""}`
    : `${programName} · ${houseName ? `${houseName} House · ` : ""}${points} pts`;

  return (
    <div className={`certificate-page ${displayFont.className}`}>
      <div className="certificate-frame">
        <p className="cert-field cert-field-name">{studentName}</p>

        <p className="cert-field cert-field-program" title={programLine}>
          {programLine}
        </p>

        {isParticipation ? (
          <>
            {/* Masks the template's baked-in "Position" word — the two-line
                replacement text below sits where that word is, not above it like
                the position number does, so the word has to go rather than just
                being overlapped. */}
            <div className="cert-position-patch" aria-hidden="true" />
            <p className="cert-field cert-field-position cert-field-position-participation">
              PARTICIPATION
              <br />
              CERTIFICATE
            </p>
          </>
        ) : (
          <p className="cert-field cert-field-position">
            {position}
            <span className="cert-position-suffix">{positionSuffix}</span>
          </p>
        )}

        <p className="cert-field cert-field-class">{className ?? ""}</p>
        <p className="cert-field cert-field-rollno">{rollNumber ?? ""}</p>
        <p className="cert-field cert-field-category">{categoryLabel}</p>
        <p className="cert-field cert-field-date">{formatDate(new Date())}</p>

        {/* All portaled outside Next's render tree at print time — plain <img> avoids
            next/image's lazy-loading and srcset handling for these Storage-hosted
            images, neither of which is wanted for a static print asset.
            crossOrigin="anonymous" is for generateCertificatePdf.ts's html2canvas
            capture — without it, a cross-origin image (these are all Supabase Storage
            URLs, a different origin than the app) taints the canvas and html2canvas
            silently renders a blank box in its place instead of the image. */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={studentName} className="cert-photo" crossOrigin="anonymous" />
        ) : null}

        {sealUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sealUrl} alt="Official seal" className="cert-seal" crossOrigin="anonymous" />
        ) : null}

        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt="Signature"
            className="cert-signature"
            crossOrigin="anonymous"
          />
        ) : null}

        {signatoryName ? <p className="cert-field cert-field-signatory">{signatoryName}</p> : null}
      </div>
    </div>
  );
}
