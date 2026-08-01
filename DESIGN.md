---
name: School Function Judging & Live Score Management — Audience Dashboard
description: The Milad-un-Nabi festival's live results screen — a lit-stage, gold-on-green ceremonial dashboard, scoped to /audience only.
colors:
  stage-green-950: "oklch(0.19 0.05 152)"
  stage-green-900: "oklch(0.24 0.06 152)"
  stage-green-800: "oklch(0.32 0.07 152)"
  stage-gold: "oklch(0.78 0.13 85)"
  stage-gold-bright: "oklch(0.88 0.14 92)"
  stage-gold-dim: "oklch(0.6 0.1 85)"
  stage-ivory: "oklch(0.97 0.02 85)"
  stage-ink: "oklch(0.26 0.03 152)"
  house-red: "oklch(0.68 0.2 25)"
  house-blue: "oklch(0.68 0.16 255)"
  house-green: "oklch(0.72 0.15 150)"
  house-yellow: "oklch(0.85 0.15 90)"
  podium-gold: "oklch(0.85 0.15 85)"
  podium-silver: "oklch(0.8 0.02 250)"
  podium-bronze: "oklch(0.72 0.12 55)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontWeight: 700
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 400
rounded:
  panel: "1rem"
  inner: "calc(1rem - 3px)"
  chip: "9999px"
components:
  panel-frame:
    backgroundColor: "{colors.stage-green-900}"
    rounded: "{rounded.panel}"
  data-row:
    backgroundColor: "{colors.stage-ivory}"
    textColor: "{colors.stage-ink}"
    rounded: "{rounded.chip}"
  button-login:
    backgroundColor: "transparent"
    textColor: "{colors.stage-gold-bright}"
    rounded: "{rounded.panel}"
---

# Design System: Milad-un-Nabi Audience Dashboard

## Overview

**Creative North Star: "The Lit Stage"**

The audience page reads like the moment the curtain opens on a mosque-hall festival
stage: a deep green auditorium, a ring of gold ornament framing each scene, and a lit
fanous lantern marking whatever is live right now. This is the **real, confirmed
branding** of the Milad-un-Nabi function this app serves (Muhyudheen Jumamasjid,
Chayyoth) — not an abstract mood board. The motifs (crescent-and-star, fanous lantern,
mosque-dome silhouette) are drawn as original inline SVGs in the codebase, never traced
from the reference poster the user shared; that poster stays a palette/motif source,
not an embedded asset.

This system is **scoped to `/audience` only** (`src/app/audience/layout.tsx`'s
`.audience-shell` class). Admin and judge keep the existing neutral shadcn/Geist system
untouched — this is not a whole-product rebrand.

**Key Characteristics:**
- Deep green ceremonial ground with gold ornamental framing, never a flat neutral dashboard.
- Dense data (house names, points, timestamps) always sits on an ivory plaque, never directly on the green ground — legibility for a crowd reading from across a hall wins over atmosphere.
- Real-time state (a lit "Now Performing" alcove, the leading house) gets a slow lantern-glow pulse; everything else stays still.
- House colour is a stable per-house accent (hashed from the group's id), not a fixed brand palette — `main_groups` has no colour column, so identity must survive without one.

## Colors

Gold carries ornament and ceremony; green is the ground everything sits on; ivory is reserved entirely for dense data surfaces so scanability never competes with atmosphere.

### Primary
- **Stage Gold** (`oklch(0.78 0.13 85)`, `--stage-gold`): panel borders, ornament, primary button/link accents, active-state highlights.
- **Stage Gold Bright** (`oklch(0.88 0.14 92)`, `--stage-gold-bright`): heading text, the brightest ornament state (glow peaks, section titles).
- **Stage Gold Dim** (`oklch(0.6 0.1 85)`, `--stage-gold-dim`): secondary borders, inner frame hairlines, muted-but-still-gold text (labels, captions).

### Neutral
- **Stage Green 950** (`oklch(0.19 0.05 152)`, `--stage-green-950`): the page ground — darkest, sets the "auditorium at night" scene.
- **Stage Green 900** (`oklch(0.24 0.06 152)`, `--stage-green-900`): panel-frame background, one step lighter than the ground.
- **Stage Green 800** (`oklch(0.32 0.07 152)`, `--stage-green-800`): the "lit" state for an active Now-Performing alcove — lighter still, reads as illuminated against its unlit `stage-green-900` sibling.
- **Stage Ivory** (`oklch(0.97 0.02 85)`, `--stage-ivory`): every dense-data row/plaque (leaderboard rows, results rows, winner cards) — the one light surface in the system, used deliberately so tabular content stays legible at a glance.
- **Stage Ink** (`oklch(0.26 0.03 152)`, `--stage-ink`): text color on ivory surfaces.

### Domain accents (house identity, pre-existing tokens, reused as-is)
- **House Red / Blue / Green / Yellow** (`--house-red/blue/green/yellow`): a stable, id-hashed accent ribbon per house on the leaderboard — display tokens only, not tied to any house's actual name.
- **Podium Gold / Silver / Bronze** (`--podium-gold/silver/bronze`): rank-1/2/3 medallions on the leaderboard and position badges on results/winners.

### Named Rules
**The Ivory Floor Rule.** Any row of real data (a name, a point total, a timestamp) sits on `stage-ivory`. Green ground and gold ornament frame the data; they never carry it directly.

## Typography

**Display Font:** Playfair Display (with Georgia, serif fallback)
**Body Font:** DM Sans (with system-ui fallback)

**Character:** A high-contrast ceremonial serif for anything naming an event, a house, or a program — carrying the gravity of the occasion — paired with a plain, dense-data-friendly sans for numbers, timestamps, and captions so scanning a long results list never feels like reading a poster.

### Hierarchy
- **Display** (700, `text-xl`–`text-2xl`, tight): event name, panel headings ("Now Performing", "Leading Houses"), program/house names inside panels.
- **Body** (400/500/600, `text-sm`–`text-base`): points, timestamps, captions, category labels — always DM Sans, always on an ivory surface.
- **Label** (600, `text-xs`, uppercase, tracked): stage-type badges, category headers, "Latest Winner" eyebrow.

## Layout

Single centered column, `max-w-4xl`, stacked panels in reading order: winner banner → now performing → leading houses (podium) → latest results (carousel) → status of festival → program winners. No sidebar, no multi-column grid at the page level — this is a single-thread scroll meant to work identically whether it's propped on a shared TV or held in one hand. Section order deliberately mirrors a reference layout (Kerala School Kalolsavam portal) the user asked to match structurally — "Leading Districts" → "Leading Houses," a hero podium instead of a plain ranked list; "Latest Results – Participants" → a house-only card carousel (no participant identity, per D-017); "Status of Kalolsavam" → "Status of Festival," per-category declared/total. Sections with no data equivalent in this app (districts, schools, venues, participant-ID search, downloads) were dropped rather than faked — see PRODUCT.md's Scope decision.

Internal grids: the two-up "Now Performing" alcove pair (`grid-cols-1 sm:grid-cols-2`, collapses to stacked on mobile); the "Status of Festival" 2/4-column category tile grid (`grid-cols-2 sm:grid-cols-4`) with a full-width overall card spanning the last row. The "Latest Results" carousel is a native CSS scroll-snap row (`overflow-x-auto snap-x snap-mandatory`), not a JS-driven arrow control — same interaction on a phone swipe and a desktop trackpad, no extra client component. A `DomeSilhouette` sits absolutely positioned across the top of the page (`inset-x-0`, `-z-10`) inside an `overflow-hidden` root, purely decorative and never affecting document flow.

## Elevation & Depth

Flat, not shadow-driven. Depth comes from the gold double-border + tonal green layering (ground → panel → lit alcove), not from box-shadow. Ivory data plaques carry a single soft `shadow-sm` — just enough to read as "sitting on top of" the green ground, not a layered elevation system.

### Named Rules
**The No-Drama-Shadow Rule.** Shadows never exceed `shadow-sm`. Any additional depth cue is tonal (a lighter green, a brighter gold) or a ring (the leading house's `ring-2 ring-(--stage-gold)`), never a heavier shadow.

## Shapes

Rounded throughout — `rounded-2xl` (1rem) panel frames, `rounded-xl` for alcoves/plaques, `rounded-full` for rank medallions and badges. No sharp corners anywhere; the softness is deliberate against the ornamental gold linework, which supplies the system's only geometric edge.

## Components

### OrnateFrame (signature component)
Every major panel (`Now Performing`, `Leading Houses`, `Program Winners`, `Latest Results`) is wrapped in `OrnateFrame` (`src/features/leaderboard/components/OrnateFrame.tsx`): a 2px gold border around a `stage-green-900` panel, a 1px `stage-gold-dim` inner hairline, and two small `CrescentStar` accents at the top corners. Ornament stays strictly at the frame; content inside is never itself ornamented, so dense lists stay scannable.

### Data rows / plaques
Every leaderboard row, result row, and winner card is an `stage-ivory` pill/card with `stage-ink` text, `rounded-xl`, `shadow-sm`. The leading house additionally gets `ring-2 ring-(--stage-gold)` — the only per-row emphasis technique in the system.

### Buttons
- **Shape:** inherits shadcn's `rounded-lg` button shape, unchanged.
- **Login / Fullscreen (audience-only variant):** transparent background, `border-(--stage-gold)`, `text-(--stage-gold-bright)`, `hover:bg-(--stage-gold)/10`. No filled primary button appears on this page — every action here is secondary to the data.

### Badges
Stage-type and rank badges: `border-none`, `bg-(--stage-gold)/25`, `text-(--stage-gold-bright)` or `text-(--stage-gold-dim)` depending on surface (dark ground vs. ivory row).

### Now Performing alcove
Two-up grid, each cell either "lit" (`border-(--stage-gold)`, `bg-(--stage-green-800)`, a `lantern-glow`-animated `Lantern` icon top-right) or "unlit" (`border-(--stage-gold-dim)/30`, `bg-(--stage-green-900)/60`, no icon, dimmed placeholder text). The glow animation (`@keyframes lantern-glow`, 3.2s ease-in-out, opacity 0.55→1 + scale 1→1.06) is the system's only ambient motion and respects `prefers-reduced-motion` (disabled entirely).

### Leaderboard podium (signature component)
`AudienceLeaderboard` renders ranks 1–3 as a podium row (`items-end`, CSS `order` reorders 2nd–1st–3rd visually regardless of array order): the leading house is taller (`pt-7 pb-5` vs `pt-5 pb-4`), gets a `lantern-glow`-animated `Trophy` above it, and each card's top border is its id-hashed house accent. Ranks beyond 3 drop to a plain ivory row list below the podium — with this app's real house counts (typically 3–4), the podium usually *is* the whole leaderboard.

### Results carousel
`LatestResultsList` cards are fixed-width (`w-44`), `snap-start`, ivory, showing position badge + house name + program name + points + an `Asia/Kolkata`-formatted timestamp. No participant photo or name ever appears (D-017) — house identity and points only.

### Status of Festival tiles
`FestivalStatus`: one ivory tile per category (declared/total fraction, a thin `--house-green` progress bar, a green checkmark badge at 100%, "—" for a category with zero scheduled programs rather than a misleading 0%), plus a full-width gold-bordered `stage-green-800` "Overall Status" tile with a large percentage. Declared = `status === 'published'`; total excludes `draft` programs (an admin setup-in-progress program isn't a real commitment yet).

## Do's and Don'ts

### Do:
- **Do** put every piece of real data (name, number, timestamp) on a `stage-ivory` surface.
- **Do** keep ornament (gold borders, crescent accents) strictly at panel edges, never inside a data row.
- **Do** use the `lantern-glow` animation only for genuinely live/real-time state (the active Now Performing alcove); never as decoration on static content.
- **Do** derive house accent colour from a stable hash of the house's `id`, never from its name string (names are free-text admin input, not a reliable colour key).

### Don't:
- **Don't** apply `.audience-shell` or its tokens outside `/audience` — admin and judge keep the neutral shadcn/Geist system.
- **Don't** use Hindu-temple or generic "festival" imagery (nilavilakku, Kathakali motifs, etc.) anywhere in this system — the confirmed identity is specifically Islamic/Milad-un-Nabi (crescent, lantern, mosque dome), and an earlier direction using temple imagery was explicitly corrected and voided by the user before any code was written.
- **Don't** embed the user's reference poster image itself as an asset — it is a style/palette reference only; every motif is an original inline SVG.
