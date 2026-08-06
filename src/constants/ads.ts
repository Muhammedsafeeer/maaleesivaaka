/**
 * Ad slot layout for the /audience page.
 *
 * Ads are managed as a drag-arranged list in /admin/ads; an ad's 1-based `position`
 * selects which fixed gap between the audience page's sections it renders in. Positions
 * beyond AD_SLOT_COUNT have nowhere to render — same as an unassigned row, not an error.
 */
export const AD_SLOTS = [
  { position: 1, label: "After login bar" },
  { position: 2, label: "After Leading Houses" },
  { position: 3, label: "After Latest Winner" },
  { position: 4, label: "After Now Performing" },
  { position: 5, label: "After Status of Festival" },
  { position: 6, label: "After full standings" },
  { position: 7, label: "After Category Highlights" },
] as const;

export const AD_SLOT_COUNT = AD_SLOTS.length;

export const DEFAULT_AD_PLAY_DURATION_SECONDS = 8;
export const DEFAULT_AD_TRANSITION_DURATION_MS = 500;
