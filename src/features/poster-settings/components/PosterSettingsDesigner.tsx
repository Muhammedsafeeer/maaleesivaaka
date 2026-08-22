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
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadPosterBackground } from "@/lib/services/storage.service";
import {
  updatePosterBackgroundAction,
  updatePosterFieldsAction,
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
    const uploadResult = await uploadPosterBackground(file);
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

  const selected = fields.find((f) => f.key === selectedKey) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer select-none"
          onClick={() => handleSelectCategory(null)}
        >
          Default
        </Badge>
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
              Click a field below to show it, then drag it into place on the poster.
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
                  // Mirrors DynamicResultPosterTemplate's rendering: a nowrap text field's
                  // box shrinks to fit its content, so text-align alone has no visible
                  // effect unless the box itself is also pinned by that same edge. Photo
                  // fields have no align concept, so they always stay centered on their
                  // anchor point.
                  const translateX =
                    field.type === "text" && field.align === "left"
                      ? "0%"
                      : field.type === "text" && field.align === "right"
                        ? "-100%"
                        : "-50%";

                  return (
                  <div
                    key={field.key}
                    onPointerDown={(e) => handlePointerDown(e, field.key)}
                    className={cn(
                      "absolute cursor-grab active:cursor-grabbing",
                      field.key === selectedKey && "outline outline-2 outline-offset-2 outline-blue-500",
                    )}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      transform: `translate(${translateX}, -50%)`,
                    }}
                  >
                    {field.type === "photo" ? (
                      <div
                        className="flex items-center justify-center rounded-full border-2 border-white bg-black/30 text-white/70"
                        style={{ width: `${field.photoSize * 100}%`, aspectRatio: "1", minWidth: 32 }}
                      >
                        <ImageIcon className="size-1/2" aria-hidden="true" />
                      </div>
                    ) : (
                      <p
                        className="whitespace-nowrap px-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                        style={{
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

                {selected.key === "footer" ? (
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
                        min={8}
                        max={48}
                        step={1}
                        value={selected.fontSize}
                        onChange={(e) => updateField(selected.key, { fontSize: Number(e.target.value) })}
                        className="w-full accent-primary"
                      />
                    </div>
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
    </div>
  );
}
