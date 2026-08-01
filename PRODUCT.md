# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Admin**: staff running the festival — manages houses/groups, students, programs, judges, fixture/running order, publishes results.
- **Judge**: scores assigned programs from their own device during the event.
- **Audience**: the general public — students, parents, staff, guests attending the event. Anonymous, never logs in. Views the live dashboard (`/audience`, also the site root) on their own phone and on a shared projector/TV screen at the venue, roughly equally — this surface needs a dense, legible-from-a-distance layout AND a comfortable single-column phone layout, not just one squeezed into the other.

## Product Purpose

A single school's arts-festival judging and live-results system: admins set up houses, students, programs and judges; judges submit scores from any device; the audience follows live "now performing" status, the house leaderboard, and published results with no login and no manual refresh (Supabase Realtime).

## Positioning

Built for one school's own festival (not a multi-school/district state event) — small, fixed data model: houses (main_groups), students, programs, judges. Real-time-first: every audience-facing view updates live via Postgres change events, never polling.

## Operating Context

- The audience dashboard is the site's landing experience — `/` redirects to `/audience`. Admin/judge reach their own areas via an explicit "Login" affordance, not the homepage.
- Runs during a live event: a program is "on stage" (status `scoring`), one at a time per stage (on-stage / off-stage run independently, so up to one program per stage can be live simultaneously).
- Results become audience-visible only after an admin explicitly publishes them (`status = 'published'`); `completed` alone is not public.
- Deployed via Vercel; backed by Supabase (Postgres + Auth + Realtime).

## Capabilities and Constraints

- Confirmed functionality on `/audience` today: "Now Performing" (per stage type), house leaderboard (ranked, points-based), latest published results feed, per-program 1st-place winners list, fullscreen toggle.
- **Scope decision (confirmed with user):** the pasted reference design is a multi-school, multi-district state festival portal (Leading Districts, Leading Schools, Venues, item-code search, downloads, multi-level nav). This app has no districts, schools, venues, or item codes — only houses/groups and programs within one school. Redesign adapts only the pieces with a real data equivalent (houses stand in for "districts/schools", programs stand in for "items") and drops concepts with nothing behind them (venues, downloads, cross-school search) rather than faking data.
- **Hard privacy constraint (D-017, non-negotiable):** the audience dashboard never shows an individual student's name or photo, at any lifecycle stage. Only program metadata (name, category, stage type) and group/house name + points/position are shown. No participant photos, no participant names/IDs, no "search by participant ID" feature (no participant-level public data exists to search).
- Realtime is mandatory for every audience-facing panel — no manual refresh, no polling.

## Brand Commitments

- No existing brand/name/logo yet for this school's festival — current placeholder title is generic ("School Function Judging & Live Score Management").
- **Corrected (2026-08-01) — real event identity confirmed with user:** the festival is a **Milad-un-Nabi function** (Islamic/Mappila Muslim mosque-organized event — mosque: Muhyudheen Jumamasjid, Chayyoth), not a generic or Hindu-temple-styled festival. The user shared their actual event poster and confirmed it is real branding to match closely, not just a mood reference. Visual identity for `/audience`: deep green ground, gold ornamental type/borders, ivory surfaces for dense data, crescent-and-star + fanous lantern + mosque dome/minaret silhouette + jasmine floral motifs — recreated originally in code (the poster image itself is not an asset file to embed, only a style/palette/motif reference). This **replaces** any Hindu-temple-derived direction (nilavilakku, Kathakali murals) considered earlier in the same session before this correction — that direction is void.
- The Kerala School Kalolsavam government-portal screenshot (see Evidence on Hand) is still the *layout/information-density* reference (panel structure, data density, real-time feel) — it is unrelated to and does not override the Milad-un-Nabi visual identity above.

## Evidence on Hand

- Reference screenshot #1: Kerala School Kalolsavam public results portal (`ulsavam.kite.kerala.gov.in`) — layout/information-density/interaction reference only, not a branding source.
- Reference screenshot #2 (real branding, confirmed): the user's actual Milad-un-Nabi event poster — Muhyudheen Jumamasjid, Chayyoth; "Maalee Sivaaka" / Rabi-ul-Awwal 12-13-14; green/gold/ivory palette; crescent+star, fanous lanterns, mosque dome, jasmine florals. This is the real visual-identity source for `/audience`.
- `/docs` (project.md, architecture.md, decisions.md, etc.) is the system of record for product/technical decisions already made; D-002, D-010, D-017 are the load-bearing ones for this surface.

## Product Principles

1. Real-time above all — every audience panel reflects live state without user action.
2. House/group pride, not individual recognition — the format is a team competition; public views never surface which student did what.
3. Small, honest data model — build only what real data supports; no placeholder districts/schools/venues.
4. Two real layouts, not one compressed — dense desktop/TV dashboard and a genuinely comfortable single-column phone view.
5. Publish is a deliberate gate — nothing appears to the audience before an admin explicitly publishes it.

## Accessibility & Inclusion

Legible-from-a-distance requirement for shared-screen/projector viewing (large type, high contrast) alongside standard mobile-web accessibility (touch target sizing, contrast, reduced-motion respect for any added animation).
