/** Plain CSS for /tv — no Tailwind, nesting, oklch, or calc division.
 *  Stage fills the real panel; sizes use vmin so a 1920×1080 design is never
 *  painted 1:1 (or 2×) and cropped. Survives TV browsers that skip the main CSS bundle.
 */
export const TV_CRITICAL_CSS = `
html, body, #app-root {
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #1a1028 !important;
}
.tv-shell {
  height: 100% !important;
  background: #1a1028 !important;
  color: #f7f3e8 !important;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  font-size: 16px;

  --stage-cream: #ffffff;
  --stage-cream-deep: #ebe3cf;
  --stage-ivory: #fffcf5;
  --stage-ink: #2a2418;
  --stage-gold: #9a7220;
  --stage-gold-bright: #7a5510;
  --stage-gold-dim: #b89540;
  --stage-spotlight: #2a1840;
  --stage-spotlight-deep: #1a1028;
  --stage-spotlight-card: #3a2550;
  --stage-spotlight-ink: #f7f3e8;
  --stage-spotlight-ink-dim: #cfc6b0;
  --stage-spotlight-gold: #e8c44a;

  /* 1080p design: Npx → N/10.8 vmin (vmin = 1% of the shorter side) */
  --tv-4: 0.37vmin;
  --tv-6: 0.556vmin;
  --tv-8: 0.741vmin;
  --tv-10: 0.926vmin;
  --tv-12: 1.111vmin;
  --tv-14: 1.296vmin;
  --tv-16: 1.481vmin;
  --tv-18: 1.667vmin;
  --tv-20: 1.852vmin;
  --tv-24: 2.222vmin;
  --tv-28: 2.593vmin;
  --tv-30: 2.778vmin;
  --tv-32: 2.963vmin;
  --tv-36: 3.333vmin;
  --tv-40: 3.704vmin;
  --tv-48: 4.444vmin;
  --tv-56: 5.185vmin;
  --tv-60: 5.556vmin;
  --tv-64: 5.926vmin;
  --tv-72: 6.667vmin;
  --tv-80: 7.407vmin;
  --tv-96: 8.889vmin;
  --tv-128: 11.852vmin;
  --tv-256: 23.704vmin;
  --tv-288: 26.667vmin;
  --tv-384: 35.556vmin;
}
#tv-viewport {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  overflow: hidden !important;
  background: #1a1028 !important;
  z-index: 1;
}
#tv-stage {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  width: auto !important;
  height: auto !important;
  overflow: hidden !important;
  background: #1a1028 !important;
  -webkit-transform: none !important;
  transform: none !important;
  zoom: normal !important;
}
#tv-stage-inner {
  position: absolute !important;
  top: 3% !important;
  right: 3% !important;
  bottom: 3% !important;
  left: 3% !important;
  color: #f7f3e8;
  font-size: var(--tv-24);
}
/* If the main Tailwind bundle never applies, keep icons/text from exploding. */
#tv-stage svg {
  max-width: 36vmin !important;
  max-height: 36vmin !important;
  flex-shrink: 0;
}
#tv-stage svg[viewBox="0 0 200 60"] {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  max-width: none !important;
  height: 12vmin !important;
  max-height: 12vmin !important;
  color: rgba(232, 196, 74, 0.12) !important;
}
#tv-stage .lantern-glow {
  animation: none !important;
  opacity: 1 !important;
  -webkit-transform: none !important;
  transform: none !important;
}
#tv-boot-debug {
  position: fixed !important;
  top: 8px !important;
  left: 8px !important;
  z-index: 99999 !important;
  max-width: 92% !important;
  padding: 6px 10px !important;
  border-radius: 4px !important;
  background: rgba(0,0,0,0.88) !important;
  color: #b8f55a !important;
  font: 12px/1.35 monospace !important;
  pointer-events: none !important;
}
`.trim();
