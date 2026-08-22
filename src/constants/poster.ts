/**
 * Poster designer field catalog — mirrors the Flutter app's
 * lib/features/admin/poster/data/poster_models.dart exactly (same keys, same default
 * positions/styles) since both clients read/write the same poster_settings.fields
 * jsonb column (supabase/migrations/20260806110000_poster_settings.sql). Keep the two
 * in sync by hand if this list ever changes.
 */

export type PosterFieldType = "text" | "photo";
export type PosterAlign = "left" | "center" | "right";
export type PosterFontFamily =
  | "sans"
  | "serif"
  | "mono"
  | "malayalam_sans"
  | "malayalam_serif"
  | "display_bold"
  | "classic_serif"
  | "condensed"
  | "script"
  | "rounded";

export type PosterField = {
  key: string;
  label: string;
  type: PosterFieldType;
  /** Fraction (0..1) of the background image's width/height — resolution-independent. */
  x: number;
  y: number;
  fontSize: number;
  photoSize: number;
  /** Fraction (0..1) of the poster's width — a text field's own box width, so long
   * text wraps onto a second line instead of overflowing past the poster edge, and so
   * `align` has a box to align left/center/right within. Not meaningful for photo
   * fields (photoSize already controls their circular size). */
  width: number;
  color: string;
  bold: boolean;
  /** Not present on rows saved before this field existed — treat missing as false,
   * same "additive, harmless extra/missing key" reasoning as the rest of this jsonb
   * column (kept in sync with the Flutter app's PosterField.italic). */
  italic?: boolean;
  align: PosterAlign;
  fontFamily: PosterFontFamily;
  visible: boolean;
  /** Only meaningful for the 'footer' field — admin-typed text, not derived data. */
  staticText?: string;
};

export const POSTER_COLOR_SWATCHES = [
  "#FFFFFF", "#000000", "#0F5C33", "#C9A227", "#D32F2F", "#1565C0",
  "#7B1FA2", "#F57C00", "#00897B", "#C2185B",
];
export const POSTER_FONT_OPTIONS: { value: PosterFontFamily; label: string }[] = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
  { value: "malayalam_sans", label: "Malayalam Sans" },
  { value: "malayalam_serif", label: "Malayalam Serif" },
  { value: "display_bold", label: "Bold Display" },
  { value: "classic_serif", label: "Classic Serif" },
  { value: "condensed", label: "Condensed" },
  { value: "script", label: "Script" },
  { value: "rounded", label: "Rounded" },
];

export function defaultPosterFields(): PosterField[] {
  const fields: PosterField[] = [
    { key: "serial_number", label: "Serial number", type: "text", x: 0.06, y: 0.05, fontSize: 16, photoSize: 0.18, width: 0.15, color: "#FFFFFF", bold: true, align: "left", fontFamily: "sans", visible: false },
    { key: "program_name", label: "Program name", type: "text", x: 0.5, y: 0.08, fontSize: 26, photoSize: 0.18, width: 0.6, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
    { key: "program_name_malayalam", label: "Program name (Malayalam)", type: "text", x: 0.5, y: 0.11, fontSize: 20, photoSize: 0.18, width: 0.6, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
    { key: "category", label: "Category", type: "text", x: 0.5, y: 0.15, fontSize: 14, photoSize: 0.18, width: 0.5, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
    { key: "category_malayalam", label: "Category (Malayalam)", type: "text", x: 0.5, y: 0.18, fontSize: 14, photoSize: 0.18, width: 0.5, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
  ];

  for (const p of [1, 2, 3]) {
    const cx = 0.2 + (p - 1) * 0.3;
    fields.push(
      { key: `position_${p}_photo`, label: `Winner ${p} photo`, type: "photo", x: cx, y: 0.45, fontSize: 16, photoSize: 0.2, width: 0.2, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
      { key: `position_${p}_name`, label: `Winner ${p} name`, type: "text", x: cx, y: 0.6, fontSize: 15, photoSize: 0.18, width: 0.35, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
      { key: `position_${p}_name_malayalam`, label: `Winner ${p} name (Malayalam)`, type: "text", x: cx, y: 0.625, fontSize: 13, photoSize: 0.18, width: 0.35, color: "#FFFFFF", bold: true, align: "center", fontFamily: "sans", visible: false },
      { key: `position_${p}_class`, label: `Winner ${p} class`, type: "text", x: cx, y: 0.65, fontSize: 12, photoSize: 0.18, width: 0.25, color: "#FFFFFF", bold: false, align: "center", fontFamily: "sans", visible: false },
      { key: `position_${p}_group`, label: `Winner ${p} group`, type: "text", x: cx, y: 0.675, fontSize: 12, photoSize: 0.18, width: 0.35, color: "#FFFFFF", bold: false, align: "center", fontFamily: "sans", visible: false },
      { key: `position_${p}_group_malayalam`, label: `Winner ${p} group (Malayalam)`, type: "text", x: cx, y: 0.7, fontSize: 11, photoSize: 0.18, width: 0.35, color: "#FFFFFF", bold: false, align: "center", fontFamily: "sans", visible: false },
      { key: `position_${p}_points`, label: `Winner ${p} points`, type: "text", x: cx, y: 0.725, fontSize: 12, photoSize: 0.18, width: 0.2, color: "#FFFFFF", bold: false, align: "center", fontFamily: "sans", visible: false },
    );
  }

  // Three independent footer lines (not one multi-line field) so each can be shown,
  // positioned, and styled on its own — e.g. a contact line in one font/size and a
  // sign-off in another. Stacked upward from "footer", which keeps its original y so an
  // already-configured design's footer position doesn't shift under it.
  fields.push(
    {
      key: "footer",
      label: "Footer",
      type: "text",
      x: 0.5,
      y: 0.94,
      fontSize: 11,
      photoSize: 0.18,
      width: 0.9,
      color: "#FFFFFF",
      bold: false,
      align: "center",
      fontFamily: "sans",
      visible: false,
      staticText: "",
    },
    {
      key: "footer_2",
      label: "Footer 2",
      type: "text",
      x: 0.5,
      y: 0.9,
      fontSize: 11,
      photoSize: 0.18,
      width: 0.9,
      color: "#FFFFFF",
      bold: false,
      align: "center",
      fontFamily: "sans",
      visible: false,
      staticText: "",
    },
    {
      key: "footer_3",
      label: "Footer 3",
      type: "text",
      x: 0.5,
      y: 0.86,
      fontSize: 11,
      photoSize: 0.18,
      width: 0.9,
      color: "#FFFFFF",
      bold: false,
      align: "center",
      fontFamily: "sans",
      visible: false,
      staticText: "",
    },
  );

  return fields;
}
