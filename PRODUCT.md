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

- No existing brand/name/logo yet for this school itself — current placeholder title is generic ("School Function Judging & Live Score Management"); `/audience` carries its own confirmed event identity below.
- **Real event identity, confirmed with user:** the festival is a **Milad-un-Nabi function**, "Maalee Sivaaka" (Islamic/Mappila Muslim mosque-organized event — mosque: Muhyudheen Jumamasjid, Chayyoth), not a generic or Hindu-temple-styled festival — an earlier Hindu-temple-derived direction (nilavilakku, Kathakali murals) was explicitly corrected and voided before any code was written. The mosque's own event banner (`documents/malee banner.png`, `documents/malee new.jpg`) is the real, confirmed branding source, not a mood reference — Muhyudheen Jumamasjid, Chayyoth; "മാലീ സിവാക" / "MAALEE SIVAA KA"; Rabi-ul-Awwal 12-13-14; a deep green + gold + ivory palette; crescent+star, fanous lanterns, mosque dome, jasmine florals.
- **Current visual system (consolidated):** light ivory/cream ground with gold ornament, plus one dark "spotlight" surface family — in the banner's own authentic green, not a borrowed hue — reserved for genuinely-highlighted moments (Leading Houses' whole panel, Now Performing's live alcove, the Status of Festival's Overall tile). Every other panel (Now Performing, Latest Results, Status of Festival, Program Winners) carries its own jewel-tone section accent so each reads as visually distinct at a glance, echoing the Kerala Kalolsavam reference's "each panel gets its own colour" structural pattern without literally reusing its specific purple/pink/teal hues. Crescent-and-star, fanous lantern, and mosque-dome motifs are original inline SVGs, never traced from the banner. Full rationale and exact tokens: `DESIGN.md`.
- **Header wordmark, confirmed:** the page header's event name reads **"MAALEE SIVAA KA"** (the banner's own English rendering), set in a bold tracked uppercase sans matching the banner's English lockup style — not the Playfair serif used for section headings. A separate small "Live" pill badge (gold, lantern-glow pulse dot) carries the real-time signal.
- **Banner is embedded, not just referenced:** the actual banner file (`public/audience/malee-banner.png`) runs as the page's own top masthead image, gold-bordered, above the header — explicitly requested by the user. Every *other* motif (crescent, lantern, dome) stays an original inline SVG; only the masthead itself is the real image.
- This system went through several iterations before landing here (ground colour tried green, then purple, then banner-graded green, then purple again, before this consolidated pass settled on the banner's own authentic green for the spotlight family) — worth knowing if you're reading old commits, not relevant to using or extending the system today.

## Evidence on Hand

- Reference screenshot #1: Kerala School Kalolsavam public results portal (`ulsavam.kite.kerala.gov.in`) — layout/information-density/interaction/per-panel-colour-pattern reference only, never a colour or branding source.
- Reference screenshot #2 (real branding, confirmed): the mosque's actual Maalee Sivaaka / Milad-un-Nabi event banner (`documents/malee banner.png`, `documents/malee new.jpg`) — see Brand Commitments. This is the source for gold ornament, ivory surfaces, motifs, the header wordmark, the embedded masthead image, and (as of the consolidated pass) the spotlight surface's green.
- `/docs` (project.md, architecture.md, decisions.md, etc.) is the system of record for product/technical decisions already made; D-002, D-010, D-017 are the load-bearing ones for this surface.

## Product Principles

1. Real-time above all — every audience panel reflects live state without user action.
2. House/group pride, not individual recognition — the format is a team competition; public views never surface which student did what.
3. Small, honest data model — build only what real data supports; no placeholder districts/schools/venues.
4. Two real layouts, not one compressed — dense desktop/TV dashboard and a genuinely comfortable single-column phone view.
5. Publish is a deliberate gate — nothing appears to the audience before an admin explicitly publishes it.

## Accessibility & Inclusion

Legible-from-a-distance requirement for shared-screen/projector viewing (large type, high contrast) alongside standard mobile-web accessibility (touch target sizing, contrast, reduced-motion respect for any added animation).
