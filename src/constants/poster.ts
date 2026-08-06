/**
 * Poster designer field catalog — mirrors the Flutter app's
 * lib/features/admin/poster/data/poster_models.dart exactly (same keys, same default
 * positions/styles) since both clients read/write the same poster_settings.fields
 * jsonb column (supabase/migrations/20260806110000_poster_settings.sql). Keep the two
 * in sync by hand if this list ever changes.
 */

export type PosterFieldType = "text" | "photo";
export type PosterAlign = "left" | "center" | "right";

export type PosterField = {
  key: string;
  label: string;
  type: PosterFieldType;
  /** Fraction (0..1) of the background image's width/height — resolution-independent. */
  x: number;
  y: number;
  fontSize: number;
  photoSize: number;
  color: string;
  bold: boolean;
  align: PosterAlign;
  visible: boolean;
  /** Only meaningful for the 'footer' field — admin-typed text, not derived data. */
  staticText?: string;
};

export const POSTER_COLOR_SWATCHES = ["#FFFFFF", "#000000", "#0F5C33", "#C9A227", "#D32F2F", "#1565C0"];

export function defaultPosterFields(): PosterField[] {
  const fields: PosterField[] = [
    { key: "program_name", label: "Program name", type: "text", x: 0.5, y: 0.08, fontSize: 26, photoSize: 0.18, color: "#FFFFFF", bold: true, align: "center", visible: false },
    { key: "category", label: "Category", type: "text", x: 0.5, y: 0.15, fontSize: 14, photoSize: 0.18, color: "#FFFFFF", bold: true, align: "center", visible: false },
  ];

  for (const p of [1, 2, 3]) {
    const cx = 0.2 + (p - 1) * 0.3;
    fields.push(
      { key: `position_${p}_photo`, label: `Winner ${p} photo`, type: "photo", x: cx, y: 0.45, fontSize: 16, photoSize: 0.2, color: "#FFFFFF", bold: true, align: "center", visible: false },
      { key: `position_${p}_name`, label: `Winner ${p} name`, type: "text", x: cx, y: 0.6, fontSize: 15, photoSize: 0.18, color: "#FFFFFF", bold: true, align: "center", visible: false },
      { key: `position_${p}_group`, label: `Winner ${p} group`, type: "text", x: cx, y: 0.65, fontSize: 12, photoSize: 0.18, color: "#FFFFFF", bold: false, align: "center", visible: false },
      { key: `position_${p}_points`, label: `Winner ${p} points`, type: "text", x: cx, y: 0.7, fontSize: 12, photoSize: 0.18, color: "#FFFFFF", bold: false, align: "center", visible: false },
    );
  }

  fields.push({
    key: "footer",
    label: "Footer",
    type: "text",
    x: 0.5,
    y: 0.94,
    fontSize: 11,
    photoSize: 0.18,
    color: "#FFFFFF",
    bold: false,
    align: "center",
    visible: false,
    staticText: "",
  });

  return fields;
}
