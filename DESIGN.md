---
name: School Function Judging & Live Score Management — Audience Dashboard
description: The Maalee Sivaaka (Milad-un-Nabi) festival's live results screen — a plain white, unboxed ceremonial dashboard with one dark spotlight surface and per-panel jewel-tone heading accents, scoped to /audience only.
colors:
  stage-cream: "oklch(1 0 0)"
  stage-cream-deep: "oklch(0.915 0.022 85)"
  stage-ivory: "oklch(0.995 0.005 85)"
  stage-ink: "oklch(0.23 0.035 150)"
  stage-gold: "oklch(0.6 0.15 82)"
  stage-gold-bright: "oklch(0.45 0.16 80)"
  stage-gold-dim: "oklch(0.7 0.1 84)"
  stage-spotlight: "oklch(0.23 0.07 152)"
  stage-spotlight-deep: "oklch(0.16 0.06 152)"
  stage-spotlight-card: "oklch(0.3 0.07 152)"
  stage-spotlight-ink: "oklch(0.97 0.02 85)"
  stage-spotlight-ink-dim: "oklch(0.8 0.03 85)"
  stage-spotlight-gold: "oklch(0.84 0.14 85)"
  section-emerald: "oklch(0.48 0.13 155)"
  section-sapphire: "oklch(0.46 0.13 250)"
  section-ruby: "oklch(0.46 0.16 20)"
  section-amber: "oklch(0.5 0.15 60)"
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
  wordmark:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 800
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 400
rounded:
  panel: "1rem"
  inner: "calc(1rem - 3px)"
  chip: "9999px"
components:
  spotlight-panel:
    backgroundColor: "{colors.stage-spotlight}"
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

# Design System: Maalee Sivaaka Audience Dashboard

## Overview

**Creative North Star: "The Lit Stage"**

The audience page reads like a festival hall in daylight, gold-trimmed and ready — with
one deliberately dark spotlight cutting through it wherever something is actually
happening right now. This is the **real, confirmed branding** of the Maalee Sivaaka
(Milad-un-Nabi) function this app serves (Muhyudheen Jumamasjid, Chayyoth), colour-graded
from the mosque's own event banner (`documents/malee banner.png`) — not an abstract mood
board. The motifs (crescent-and-star, fanous lantern, mosque-dome silhouette) are drawn
as original inline SVGs in the codebase, never traced from the banner; the banner itself
appears exactly once, as the page's own top masthead image.

This system is **scoped to `/audience` only** (`src/app/audience/layout.tsx`'s
`.audience-shell` class, no `.dark` class alongside it). Admin and judge keep the
existing neutral shadcn/Geist system untouched — this is not a whole-product rebrand.

**Key Characteristics:**
- A plain white ground with no boxed/bordered panels — sections are separated by spacing and by their heading's own colour, not by a frame. Never a dark theme with light variables layered on top.
- **One spotlight family**, one meaning: wherever the page needs to say "this is the highlighted moment," it uses the same dark, authentic-green `--stage-spotlight-*` treatment — Leading Houses' whole panel, Now Performing's live alcove, the Overall Status tile. Not three unrelated dark treatments improvised separately, and the one place a background/box still appears at all.
- Every other panel carries its own jewel-tone section accent (emerald, sapphire, amber, ruby) on its *heading*, so five sections are five distinguishable colours at a glance — without needing five different background treatments.
- Dense data (house names, points, timestamps) always sits on an ivory plaque, never directly on the white ground or a section accent colour — legibility for a crowd reading from across a hall wins over atmosphere.
- The event wordmark ("MAALEE SIVAA KA") is a bold, tracked, uppercase sans — matching the banner's own English lockup style — not the ceremonial serif used for section headings.
- Real-time state (a lit "Now Performing" alcove, the header's "Live" badge) gets a slow lantern-glow pulse; everything else stays still.
- House colour is a stable per-house accent (hashed from the group's id), not a fixed brand palette — `main_groups` has no colour column, so identity must survive without one.

## Colors

Gold carries ornament, ceremony, and "this is the one important number" (never section identity). Cream/ivory is the light ground and its data surfaces. One dark spotlight family, in the banner's own green, marks genuinely live/highlighted moments. A small jewel-tone set gives every other panel its own identity.

### Primary
- **Stage Gold** (`oklch(0.6 0.15 82)`, `--stage-gold`): ornament (banner masthead border, lit-alcove border), primary button/link accents.
- **Stage Gold Bright** (`oklch(0.45 0.16 80)`, `--stage-gold-bright`): the darkest, most emphasized gold — used as *text* (headings, badges) on light surfaces.
- **Stage Gold Dim** (`oklch(0.7 0.1 84)`, `--stage-gold-dim`): secondary borders (unlit alcove, footer rule), muted-but-still-gold text on light surfaces.

### Ground & data surfaces
- **Stage Cream** (`oklch(1 0 0)`, `--stage-cream`): the page ground — plain white.
- **Stage Cream Deep** (`oklch(0.915 0.022 85)`, `--stage-cream-deep`): the "unlit" Now Performing alcove's background — the only place this token is still used now that panels themselves have no background.
- **Stage Ivory** (`oklch(0.995 0.005 85)`, `--stage-ivory`): every dense-data row/plaque (leaderboard rows, results rows, winner cards) — the brightest surface in the system, so tabular content stays legible at a glance regardless of which panel it's in.
- **Stage Ink** (`oklch(0.23 0.035 150)`, `--stage-ink`): text on any light surface (ground, panel, or ivory card).

### The spotlight
One dark surface family, in the banner's own authentic green — not a borrowed hue — reserved for the page's genuinely-live-or-most-important moments.
- **Stage Spotlight** (`oklch(0.23 0.07 152)`, `--stage-spotlight`): Now Performing's active alcove; the Status of Festival's Overall tile.
- **Stage Spotlight Deep** (`oklch(0.16 0.06 152)`, `--stage-spotlight-deep`): the darker end of Leading Houses' gradient panel.
- **Stage Spotlight Card** (`oklch(0.3 0.07 152)`, `--stage-spotlight-card`): podium/row cards *within* the spotlight (Leading Houses) — lighter than the panel behind them, so they still read as distinct cards.
- **Stage Spotlight Ink** (`oklch(0.97 0.02 85)`, `--stage-spotlight-ink`) / **Ink Dim** (`oklch(0.8 0.03 85)`, `--stage-spotlight-ink-dim`): light text on any spotlight surface.
- **Stage Spotlight Gold** (`oklch(0.84 0.14 85)`, `--stage-spotlight-gold`): bright gold for text/ornament/badges directly on a spotlight surface — the regular `--stage-gold*` tokens are darkened for the light ground and would be unreadably dark here.

### Section-identity accents
One jewel tone per light-ground panel's *heading* (no background or border anymore) — Now Performing (emerald), Latest Results (sapphire), Status of Festival (amber), Program Winners (ruby). Leading Houses doesn't get one: its spotlight background already sets it apart.
- **Emerald** (`oklch(0.48 0.13 155)`, `--section-emerald`), **Sapphire** (`oklch(0.46 0.13 250)`, `--section-sapphire`), **Ruby** (`oklch(0.46 0.16 20)`, `--section-ruby`), **Amber** (`oklch(0.5 0.15 60)`, `--section-amber`).

### Domain accents (house identity, pre-existing tokens, reused as-is)
- **House Red / Blue / Green / Yellow** (`--house-red/blue/green/yellow`): a stable, id-hashed accent ribbon per house on the leaderboard — display tokens only, not tied to any house's actual name, and unrelated to both the ground tokens and the section accents above (three separate token families that happen to share some hue names by coincidence).
- **Podium Gold / Silver / Bronze** (`--podium-gold/silver/bronze`): rank-1/2/3 medallions on the leaderboard and position badges on results/winners.

### Named Rules
**The Ivory Floor Rule.** Any row of real data (a name, a point total, a timestamp) sits on `stage-ivory`, or on a spotlight card if it's inside a spotlight panel. The white ground and any accent colour frame the data; they never carry it directly.
**Gold Means "The One Important Thing."** Gold is never a section's identity colour — it marks ornament (the banner, the lit alcove border), or the single most emphasized number/moment inside a panel (the Overall Status tile, the leading house's ring). Section identity is always one of the four jewel tones, carried by heading colour alone.

## Typography

**Display Font:** Playfair Display (with Georgia, serif fallback)
**Wordmark:** DM Sans, extra-bold (800), tracked wide, uppercase — used only for the page's own event name in the header, matching the banner's bold sans English lockup ("MAALEE SIVAA KA"), not the serif treatment used elsewhere.
**Body Font:** DM Sans (with system-ui fallback)

**Character:** A high-contrast ceremonial serif for section headings and in-panel names — carrying the gravity of the occasion — paired with a plain, dense-data-friendly sans for numbers, timestamps, and captions so scanning a long results list never feels like reading a poster. The header wordmark is a deliberate third register: bold tracked sans, because that's what the real banner actually uses for its English rendering of the event name.

### Hierarchy
- **Wordmark** (800, `text-xl`–`text-2xl`, tracked wide, uppercase): the page header's event name only ("MAALEE SIVAA KA").
- **Display** (700, `text-xl`–`text-2xl`, tight): panel headings, program/house names inside panels — each heading's colour matches its panel's accent (or spotlight gold, for Leading Houses).
- **Body** (400/500/600, `text-sm`–`text-base`): points, timestamps, captions, category labels — always DM Sans.
- **Label** (600, `text-xs`, uppercase, tracked): stage-type badges, category headers, "Latest Winner" eyebrow, header "Live" badge.

## Layout

Single centered column, `max-w-4xl`, stacked panels in reading order: banner masthead → header (wordmark + Live badge only — no Fullscreen toggle, no Login) → **leading houses (spotlight podium), leading the page by explicit request** → latest winner (gold, a 3-card top-3-of-the-freshest-program podium) → now performing (emerald, gold spotlight alcove when live) → latest results (sapphire carousel) → status of festival (amber, gold spotlight overall tile) → program winners (ruby) → footer (Login only). No sidebar, no multi-column grid at the page level — a single-thread scroll that works identically on a shared TV or in one hand. The podium/carousel/tile idioms mirror a reference layout (Kerala School Kalolsavam portal) the user asked to match structurally; sections with no data equivalent in this app (districts, schools, venues, participant-ID search, downloads) were dropped rather than faked — see PRODUCT.md's Scope decision.

Internal grids: the two-up "Now Performing" alcove pair (`grid-cols-1 sm:grid-cols-2`, collapses to stacked on mobile); the "Status of Festival" 2/4-column category tile grid (`grid-cols-2 sm:grid-cols-4`) with a full-width overall card spanning the last row. The "Latest Results" carousel is a native CSS scroll-snap row (`overflow-x-auto snap-x snap-mandatory`), not a JS-driven arrow control. A `DomeSilhouette` sits absolutely positioned across the top of the page, purely decorative and never affecting document flow.

## Elevation & Depth

Flat, not shadow-driven, and — since the "remove outer box" pass — mostly flush with the page rather than layered at all. The spotlight panel (Leading Houses) is the one surface with real tonal depth (`stage-spotlight` → `stage-spotlight-deep` gradient). Ivory data plaques and spotlight cards carry a single soft `shadow-sm` — just enough to read as "sitting on the page," not a layered elevation system.

### Named Rules
**The No-Drama-Shadow Rule.** Shadows never exceed `shadow-sm`. Any additional depth cue is tonal or a ring (the leading house's `ring-2 ring-(--stage-gold)`), never a heavier shadow.

## Shapes

Rounded throughout — `rounded-2xl` for the spotlight panel and the banner masthead, `rounded-xl` for alcoves/plaques/cards, `rounded-full` for rank medallions and badges. No sharp corners anywhere.

## Components

### Banner masthead
The very first element on the page: the mosque's actual event banner
(`public/audience/malee-banner.png`, `next/image`, `priority`, intrinsic 1942×809) inside
a `rounded-2xl border-2 border-(--stage-gold)` frame — no inner padding, the image runs
edge-to-edge. The one place the real banner asset itself appears; every other motif is
an original inline SVG.

### Header wordmark + Live badge
Pairs the `MAALEE SIVAA KA` wordmark (bold tracked sans, `--stage-gold-bright`) with a
small pill badge (`bg-(--stage-gold)/15`, uppercase `text-[0.65rem]`) containing a
`lantern-glow`-animated gold dot and the word "Live."

### OrnateFrame
Every major panel is wrapped in `OrnateFrame` (`src/features/leaderboard/components/OrnateFrame.tsx`).
Used to be an ornate gold double-border frame with crescent-star corners ("the outer
box") — removed by explicit request. What's left is deliberately plain: consistent
padding (`p-4 sm:p-5`), and one prop, `surface` (`light` | `spotlight`, default
`light`). `light` has no background at all — the section sits directly on the page's
white ground. `spotlight` swaps in the dark `--stage-spotlight` → `--stage-spotlight-deep`
gradient with `rounded-2xl` and `shadow-sm` — the one panel that still looks like a
"box," because it needs a background to read as dark at all. A caller using
`surface="spotlight"` is responsible for giving its own content the matching
`--stage-spotlight-ink*` text treatment — the Ivory Floor Rule's light-card assumption
doesn't hold there. Section identity now comes entirely from each heading's own text
colour (set independently in `audience/page.tsx`), not from anything OrnateFrame itself
renders.

### Data rows / plaques
Every leaderboard row, result row, and winner card is a `stage-ivory` pill/card with
`stage-ink` text (or, inside a spotlight panel, `stage-spotlight-card` with
`stage-spotlight-ink` text), `rounded-xl`, `shadow-sm`. The leading house additionally
gets `ring-2 ring-(--stage-gold)` — the only per-row emphasis technique in the system,
deliberately always gold (gold marks "the winner," not "this panel").

### Buttons
- **Shape:** inherits shadcn's `rounded-lg` button shape, unchanged.
- **Login (audience-only variant):** transparent background, `border-(--stage-gold)`, `text-(--stage-gold-bright)`, `hover:bg-(--stage-gold)/10` — lives in a centered footer at the bottom of the page, not the header (the header is wordmark-only now; no fullscreen toggle). No filled primary button appears on this page — every action here is secondary to the data.

### Badges
Position/rank/stage-type badges tint to whichever surface they sit on: `bg-(--stage-gold-dim)/25 text-(--stage-gold-bright)` on a light card, `bg-(--stage-spotlight-gold)/20 text-(--stage-spotlight-gold)` on a spotlight card, or a section accent tint (`bg-(--section-sapphire)/15 text-(--section-sapphire)`, etc.) when the badge itself is meant to echo its panel's identity (Latest Results, Program Winners).

### Now Performing alcove
Two-up grid, each cell either "lit" (`border-(--stage-gold)`, `bg-(--stage-spotlight)`, spotlight-ink text, a `lantern-glow`-animated `Lantern` icon top-right) or "unlit" (`border-(--stage-gold-dim)/30`, `bg-(--stage-cream-deep)/60`, ink text at reduced opacity, no icon). The glow animation (`@keyframes lantern-glow`, 3.2s ease-in-out, opacity 0.55→1 + scale 1→1.06) is the system's only ambient motion and respects `prefers-reduced-motion` (disabled entirely).

### Leaderboard podium (signature component, spotlight surface)
`AudienceLeaderboard` (always inside `OrnateFrame surface="spotlight"`) renders ranks 1–3 as a podium row (`items-end`, CSS `order` reorders 2nd–1st–3rd visually regardless of array order): the leading house is taller, gets a `lantern-glow`-animated `Trophy` (size-10, `--stage-spotlight-gold`) above it, and each card's top border is its id-hashed house accent. Ranks beyond 3 drop to a plain spotlight-card row list below the podium — with this app's real house counts (typically 3-4), the podium usually *is* the whole leaderboard.

### Latest Winner podium (D-018 exception — student photo/name, not house)
`LatestWinnerPodium` (gold heading, no panel/border): the single most-recently-published *program's* own top 3, as a horizontal scroll-snap row (`w-56` cards, same carousel idiom as the results carousel below, not a JS arrow control). Each card is a full-height student photo on the left, and on the right: a rank-medal-coloured tag ("1st · Kids"), the student's bold name, and a gold footer strip with a `Trophy` icon and the program name. This is the one card in the whole system built from `LatestWinnerStudentRow` (student name/photo) rather than `PublicResultRow` (house name/photo) — see D-018. Distinct from the leaderboard podium (overall standings, spotlight surface, house-based) and the results carousel below (recency across every program, house-based, not one program's full top 3). Renders nothing (not an empty state) when no result exists yet — this panel is skipped entirely rather than shown empty.

### Results carousel
`LatestResultsList` (sapphire heading) cards are fixed-width (`w-44`), `snap-start`, ivory, showing a sapphire-tinted position badge + house photo, bold house name, a sapphire pill for the program name, then points + an `Asia/Kolkata`-formatted timestamp. No participant photo or name ever appears (D-017) — house identity and points only.

### Status of Festival tiles
`FestivalStatus` (amber heading): one ivory tile per category (declared/total fraction, a thin `--house-green` progress bar, a green checkmark badge at 100%, "—" for a category with zero scheduled programs), plus a full-width `stage-spotlight` "Overall Status" tile (gold border, spotlight-gold text) — the panel's one spotlight moment, same family as Now Performing's alcove. Declared = `status === 'published'`; total excludes `draft` programs.

## Do's and Don'ts

### Do:
- **Do** put every piece of real data on `stage-ivory` (or a spotlight card, inside a spotlight panel).
- **Do** use the `lantern-glow` animation only for genuinely live/real-time state; never as decoration on static content.
- **Do** derive house accent colour from a stable hash of the house's `id`, never from its name string.
- **Do** use the bold tracked sans wordmark treatment only for the header's own event name, never for section headings.
- **Do** keep each section's heading colour stable — it identifies *which panel this is*, not a data state.
- **Do** reach for the spotlight family, not a new dark colour, the next time something needs a "this is the highlighted moment" treatment.
- **Do** keep gold for ornament that's meant to stand out on its own (the banner border, a lit alcove) — not as a section's everyday identity colour.

### Don't:
- **Don't** apply `.audience-shell` or its tokens outside `/audience`.
- **Don't** use Hindu-temple or generic "festival" imagery anywhere in this system — the confirmed identity is specifically Islamic/Milad-un-Nabi (crescent, lantern, mosque dome).
- **Don't** re-embed the banner image anywhere beyond the single top-of-page masthead.
- **Don't** use a section accent colour for real data content, or for gold's "most important number" role (leading house's ring, Overall Status tile) — accents are panel identity only.
- **Don't** give a panel its own one-off dark background colour — if it needs to be dark, it uses the spotlight family, so "dark panel" always means the same thing everywhere on the page.
- **Don't** re-add a border/box/crescent-corner treatment to `OrnateFrame`'s `light` surface — that was explicitly removed; if a future request wants some visual separation back, ask what specifically before reaching for the old ornate frame again.
