"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Manjari,
  Noto_Sans_Malayalam,
  Montserrat,
  Merriweather,
  Oswald,
  Dancing_Script,
  Baloo_2,
} from "next/font/google";
import { toast } from "sonner";
import { Upload, ImageIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadPosterBackground } from "@/lib/services/storage.service";
import {
  updatePosterBackgroundAction,
  updatePosterFieldsAction,
  applyPosterFieldsToAllCategoriesAction,
  getPosterSettingsAction,
} from "@/features/poster-settings/actions/posterSettings.actions";
import {
  POSTER_COLOR_SWATCHES,
  POSTER_FONT_OPTIONS,
  type PosterAlign,
  type PosterField,
} from "@/constants/poster";
import type { PosterSettings } from "@/lib/services/posterSettings.service";
import type { CategoryRow } from "@/types/category";
import { cn } from "@/lib/utils/index";

/**
 * The "design fields to move and place to poster" designer — mirrors the Flutter
 * app's PosterSettingsScreen field-for-field (same field catalog, same x/y-as-fraction
 * storage, same category tabs since 20260822000000_poster_settings_per_category.sql)
 * so either client can edit a category's layout and the other picks up the change.
 * No drag-and-drop library: plain pointer events + percentage math against the
 * canvas's own bounding rect, same reasoning as the rest of this codebase's "no new
 * dependency for something this small" pattern (see AdMediaGallery's plain
 * dragstart/dragover reordering).
 */
// Fallback while the background's real dimensions are still loading — never what
// actually gets used once an image is set, just avoids a zero-height flash.
const FALLBACK_ASPECT_RATIO = 3 / 4;
const malayalamSans = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["400", "700"] });
const malayalamSerif = Manjari({ subsets: ["malayalam"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "900"] });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"] });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600", "700"] });
const baloo2 = Baloo_2({ subsets: ["latin"], weight: ["500", "700"] });

function fontFamilyFor(field: PosterField) {
  switch (field.fontFamily) {
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "mono":
      return "var(--font-geist-mono), monospace";
    case "malayalam_sans":
      return `${malayalamSans.style.fontFamily}, var(--font-geist-sans), sans-serif`;
    case "malayalam_serif":
      return `${malayalamSerif.style.fontFamily}, Georgia, serif`;
    case "display_bold":
      return montserrat.style.fontFamily;
    case "classic_serif":
      return merriweather.style.fontFamily;
    case "condensed":
      return oswald.style.fontFamily;
    case "script":
      return dancingScript.style.fontFamily;
    case "rounded":
      return baloo2.style.fontFamily;
    default:
      return "var(--font-geist-sans), sans-serif";
  }
}

export function PosterSettingsDesigner({
  initialSettings,
  categories,
}: {
  initialSettings: PosterSettings;
  categories: CategoryRow[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialSettings.category);
  const [backgroundUrl, setBackgroundUrl] = useState(initialSettings.backgroundUrl);
  const [fields, setFields] = useState<PosterField[]>(initialSettings.fields);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [isApplyingAll, startApplyAllTransition] = useTransition();
  const [applyAllOpen, setApplyAllOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ key: string; pointerId: number } | null>(null);

  async function handleSelectCategory(category: string | null) {
    if (category === selectedCategory) return;
    setSwitching(true);
    setSelectedKey(null);
    try {
      const next = await getPosterSettingsAction(category);
      setSelectedCategory(category);
      setBackgroundUrl(next.backgroundUrl);
      setFields(next.fields);
    } catch {
      toast.error("Could not load that category's design. Please try again.");
    } finally {
      setSwitching(false);
    }
  }

  // Matches the background's own proportions instead of forcing a fixed box — a
  // square upload gets a square canvas, a portrait upload a portrait one, same
  // shape decision the Flutter designer makes (see poster_settings_screen.dart's
  // _resolveAspectRatio). Previously hardcoded to a fixed 3:4 ("A4-like") box, which
  // cropped the sides off anything that wasn't already that shape.
  useEffect(() => {
    if (!backgroundUrl) return;
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = backgroundUrl;
  }, [backgroundUrl]);

  const updateField = useCallback((key: string, patch: Partial<PosterField>) => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }, []);

  function toggleVisible(field: PosterField) {
    const nowVisible = !field.visible;
    updateField(field.key, { visible: nowVisible });
    setSelectedKey(nowVisible ? field.key : selectedKey === field.key ? null : selectedKey);
  }

  async function handleBackgroundChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const uploadResult = await uploadPosterBackground(file, selectedCategory);
    if (!uploadResult.success) {
      toast.error(uploadResult.error);
      setUploading(false);
      return;
    }

    const persistResult = await updatePosterBackgroundAction(uploadResult.data, selectedCategory);
    setUploading(false);
    if (persistResult.error) {
      toast.error(persistResult.error);
      return;
    }

    setBackgroundUrl(uploadResult.data);
    toast.success("Background uploaded.");
  }

  function handleSave() {
    startSaveTransition(async () => {
      const result = await updatePosterFieldsAction(fields, selectedCategory);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Poster layout saved.");
    });
  }

  function handleApplyToAll() {
    const otherCategories = categories
      .map((c) => c.value)
      .filter((value) => value !== selectedCategory);

    startApplyAllTransition(async () => {
      // Save this category's own layout first — otherwise "apply to all" would copy
      // whatever was last saved, silently dropping any unsaved edit still sitting in
      // the canvas.
      const saveResult = await updatePosterFieldsAction(fields, selectedCategory);
      if (saveResult.error) {
        toast.error(saveResult.error);
        return;
      }

      const applyResult = await applyPosterFieldsToAllCategoriesAction(fields, otherCategories);
      if (applyResult.error) {
        toast.error(applyResult.error);
        return;
      }

      setApplyAllOpen(false);
      toast.success("Field placement applied to every category.");
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>, key: string) {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragState.current = { key, pointerId: event.pointerId };
    setSelectedKey(key);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    updateField(drag.key, { x, y });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
    }
  }

  // Arrow-key nudge for the selected field — the pointer drag above is coarse (a
  // percentage of wherever the cursor lands), so fine-tuning a field's final position
  // needs a precise alternative. Skips while focus is inside a form control (the
  // footer textarea, a colour swatch button, etc.) so arrow keys there keep doing
  // their normal job instead of also moving the field underneath.
  useEffect(() => {
    if (!selectedKey) return;

    function handleKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const deltas: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const delta = deltas[event.key];
      if (!delta) return;

      event.preventDefault();
      const step = event.shiftKey ? 0.02 : 0.004;
      setFields((prev) =>
        prev.map((f) =>
          f.key === selectedKey
            ? {
                ...f,
                x: Math.min(1, Math.max(0, f.x + delta[0] * step)),
                y: Math.min(1, Math.max(0, f.y + delta[1] * step)),
              }
            : f,
        ),
      );
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedKey]);

  const selected = fields.find((f) => f.key === selectedKey) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge
            key={c.id}
            variant={selectedCategory === c.value ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => handleSelectCategory(c.value)}
          >
            {c.label}
          </Badge>
        ))}
      </div>

      {switching ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-12 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : !backgroundUrl ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <ImageIcon className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Upload a background image to start designing this category&apos;s poster.
          </p>
          <label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBackgroundChange}
              className="hidden"
            />
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="size-4" data-icon="inline-start" />
                {uploading ? "Uploading…" : "Upload background"}
              </span>
            </Button>
          </label>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Click a field below to show it, then drag it into place on the poster — or use
              the arrow keys to nudge it (hold Shift to move faster).
            </p>
            <div className="flex items-center gap-2">
              <label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
                <Button asChild variant="outline" size="sm" disabled={uploading}>
                  <span>{uploading ? "Uploading…" : "Change background"}</span>
                </Button>
              </label>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save layout"}
              </Button>
              {categories.length > 1 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApplyAllOpen(true)}
                  disabled={isApplyingAll}
                >
                  <Copy className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Apply to all categories
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <Badge
                key={field.key}
                variant={field.visible ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleVisible(field)}
              >
                {field.label}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div
              ref={canvasRef}
              className="relative mx-auto w-full max-w-md touch-none overflow-hidden rounded-lg border border-border bg-muted select-none"
              style={{
                aspectRatio,
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {fields
                .filter((f) => f.visible)
                .map((field) => {
                  // Mirrors DynamicResultPosterTemplate's rendering: a text field's box is
                  // field.width wide (not shrink-wrapped to its text), so text-align only
                  // affects space *inside* that box — the box itself also has to be pinned
                  // by the same edge align refers to. Text stays single-line and truncates
                  // with an ellipsis rather than wrapping, so narrowing the width shrinks
                  // what's visible instead of growing the field taller — except the footer
                  // fields (field.height is set), whose free-typed text wraps within an
                  // explicit height instead. Photo fields have no align concept, so they
                  // always stay centered on their anchor point.
                  const translateX =
                    field.type === "text" && field.align === "left"
                      ? "0%"
                      : field.type === "text" && field.align === "right"
                        ? "-100%"
                        : "-50%";

                  // Width (and, for footer fields, height) live on THIS outer positioned
                  // div, not on the child inside it — a child's percentage width/height
                  // only resolves against a parent that itself has a definite size. Left on
                  // the child (as this used to be), the parent below has no width of its
                  // own, so the browser falls back to shrink-to-fit: it picks a width from
                  // whatever space is left between `left` and the canvas's own right edge,
                  // which shrinks as `left` grows — the field visibly narrowed when dragged
                  // toward the right and "recovered" when dragged back, even though
                  // field.width itself never changed. A percentage height inside a
                  // heightless parent is worse: CSS treats it as "auto" and ignores it
                  // outright, which is why the Height slider had no visible effect at all.
                  const boxWidth = field.type === "photo" ? field.photoSize : field.width;

                  return (
                  <div
                    key={field.key}
                    onPointerDown={(e) => handlePointerDown(e, field.key)}
                    className={cn(
                      "absolute cursor-grab active:cursor-grabbing",
                      field.key === selectedKey && "outline-2 outline-offset-2 outline-blue-500",
                    )}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      transform: `translate(${translateX}, -50%)`,
                      width: `${boxWidth * 100}%`,
                      height: field.type === "text" && field.height !== undefined ? `${field.height * 100}%` : undefined,
                      minWidth: field.type === "photo" ? 32 : undefined,
                    }}
                  >
                    {field.type === "photo" ? (
                      <div
                        className="flex size-full items-center justify-center rounded-full border-2 border-white bg-black/30 text-white/70"
                        style={{ aspectRatio: "1" }}
                      >
                        <ImageIcon className="size-1/2" aria-hidden="true" />
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "size-full overflow-hidden px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]",
                          field.height !== undefined ? "" : "text-ellipsis whitespace-nowrap",
                        )}
                        style={{
                          whiteSpace: field.height !== undefined ? "pre-wrap" : undefined,
                          overflowWrap: field.height !== undefined ? "break-word" : undefined,
                          color: field.color,
                          fontSize: field.fontSize,
                          fontWeight: field.bold ? 700 : 400,
                          fontStyle: field.italic ? "italic" : "normal",
                          textAlign: field.align,
                          fontFamily: fontFamilyFor(field),
                        }}
                      >
                        {field.staticText || field.label}
                      </p>
                    )}
                  </div>
                  );
                })}
            </div>

            {selected ? (
              <div className="flex w-full flex-col gap-4 rounded-lg border border-border p-4 lg:w-72">
                <p className="text-sm font-medium">{selected.label}</p>

                {selected.key === "footer" || selected.key === "footer_2" || selected.key === "footer_3" ? (
                  <textarea
                    value={selected.staticText ?? ""}
                    placeholder="Footer text"
                    rows={2}
                    onChange={(e) => updateField(selected.key, { staticText: e.target.value })}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                ) : null}

                {selected.type === "text" ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">Size ({Math.round(selected.fontSize)})</span>
                      <input
                        type="range"
                        min={1}
                        max={48}
                        step={1}
                        value={selected.fontSize}
                        onChange={(e) => updateField(selected.key, { fontSize: Number(e.target.value) })}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        Width ({Math.round(selected.width * 100)}%)
                      </span>
                      <input
                        type="range"
                        min={0.1}
                        max={2}
                        step={0.01}
                        value={selected.width}
                        onChange={(e) => updateField(selected.key, { width: Number(e.target.value) })}
                        className="w-full accent-primary"
                      />
                    </div>
                    {selected.height !== undefined ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Height ({Math.round(selected.height * 100)}%)
                        </span>
                        <input
                          type="range"
                          min={0.02}
                          max={1.5}
                          step={0.01}
                          value={selected.height}
                          onChange={(e) => updateField(selected.key, { height: Number(e.target.value) })}
                          className="w-full accent-primary"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Bold</span>
                        <Checkbox
                          checked={selected.bold}
                          onCheckedChange={(v) => updateField(selected.key, { bold: v === true })}
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Italic</span>
                        <Checkbox
                          checked={selected.italic ?? false}
                          onCheckedChange={(v) => updateField(selected.key, { italic: v === true })}
                        />
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">Font</span>
                      <div className="flex flex-wrap gap-1">
                        {POSTER_FONT_OPTIONS.map((font) => (
                          <Button
                            key={font.value}
                            type="button"
                            size="sm"
                            variant={selected.fontFamily === font.value ? "default" : "outline"}
                            onClick={() => updateField(selected.key, { fontFamily: font.value })}
                          >
                            {font.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as PosterAlign[]).map((align) => (
                        <Button
                          key={align}
                          type="button"
                          size="sm"
                          variant={selected.align === align ? "default" : "outline"}
                          onClick={() => updateField(selected.key, { align })}
                        >
                          {align}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {POSTER_COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          aria-label={`Color ${swatch}`}
                          onClick={() => updateField(selected.key, { color: swatch })}
                          className={cn(
                            "size-6 rounded-full border-2",
                            selected.color === swatch ? "border-blue-500" : "border-black/20",
                          )}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                      <label
                        className="relative flex size-6 items-center justify-center overflow-hidden rounded-full border-2 border-black/20"
                        style={{
                          background:
                            "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                        }}
                        title="Pick any color"
                      >
                        <input
                          type="color"
                          value={selected.color}
                          onChange={(e) => updateField(selected.key, { color: e.target.value })}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                          aria-label="Pick any color"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Size</span>
                    <input
                      type="range"
                      min={0.08}
                      max={0.4}
                      step={0.01}
                      value={selected.photoSize}
                      onChange={(e) => updateField(selected.key, { photoSize: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}

      <AlertDialog open={applyAllOpen} onOpenChange={setApplyAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply this layout to every category?</AlertDialogTitle>
            <AlertDialogDescription>
              Every field&apos;s position, size, colour, and alignment on this design will be
              copied onto every other category, replacing their current placement.
              Backgrounds stay untouched — only field placement changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplyingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleApplyToAll();
              }}
              disabled={isApplyingAll}
            >
              {isApplyingAll ? "Applying…" : "Apply to all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
