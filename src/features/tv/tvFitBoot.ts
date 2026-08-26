/**
 * Plain CSS for /tv — no Tailwind, nesting, oklch, calc division, flexbox, or vmin.
 *
 * Panasonic / old TV WebKits often ignore flexbox (podium stuck as a left column)
 * and the main Tailwind bundle. Layout here uses table + inline-block only.
 * Tokens: px fallback, then vw.
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

  --tv-4: 4px; --tv-4: 0.21vw;
  --tv-6: 6px; --tv-6: 0.31vw;
  --tv-8: 8px; --tv-8: 0.42vw;
  --tv-10: 10px; --tv-10: 0.52vw;
  --tv-12: 12px; --tv-12: 0.63vw;
  --tv-14: 14px; --tv-14: 0.73vw;
  --tv-16: 16px; --tv-16: 0.83vw;
  --tv-18: 18px; --tv-18: 0.94vw;
  --tv-20: 20px; --tv-20: 1.04vw;
  --tv-24: 24px; --tv-24: 1.25vw;
  --tv-28: 28px; --tv-28: 1.46vw;
  --tv-30: 30px; --tv-30: 1.56vw;
  --tv-32: 32px; --tv-32: 1.67vw;
  --tv-36: 36px; --tv-36: 1.88vw;
  --tv-40: 40px; --tv-40: 2.08vw;
  --tv-48: 48px; --tv-48: 2.5vw;
  --tv-56: 56px; --tv-56: 2.92vw;
  --tv-60: 60px; --tv-60: 3.13vw;
  --tv-64: 64px; --tv-64: 3.33vw;
  --tv-72: 72px; --tv-72: 3.75vw;
  --tv-80: 80px; --tv-80: 4.17vw;
  --tv-96: 96px; --tv-96: 5vw;
  --tv-128: 128px; --tv-128: 6.67vw;
  --tv-256: 256px; --tv-256: 13.33vw;
  --tv-288: 288px; --tv-288: 15vw;
  --tv-384: 384px; --tv-384: 20vw;
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
  overflow: hidden !important;
  background: #1a1028 !important;
}
#tv-stage-inner {
  position: absolute !important;
  top: 4% !important;
  right: 5% !important;
  bottom: 4% !important;
  left: 5% !important;
  color: #f7f3e8;
  font-size: 24px;
  font-size: var(--tv-24);
  font-family: var(--font-audience-ui), "Segoe UI", Tahoma, sans-serif;
}
#tv-stage .lantern-glow,
#tv-stage [class*="animate-in"],
#tv-stage [class*="slide-in"],
#tv-stage [class*="fade-in"] {
  animation: none !important;
  opacity: 1 !important;
  -webkit-transform: none !important;
  transform: none !important;
}

.tv-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: table;
  width: 100%;
  table-layout: fixed;
  padding: 16px 24px;
  box-sizing: border-box;
}
.tv-header-brand {
  display: table-cell;
  vertical-align: middle;
  text-align: left;
  white-space: nowrap;
}
.tv-header-brand .tv-header-icon {
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
}
.tv-header-title {
  display: inline-block;
  vertical-align: middle;
  margin: 0;
  font-family: var(--font-audience-display), Georgia, "Times New Roman", serif;
  font-size: 28px;
  font-size: var(--tv-28);
  font-weight: 700;
  color: #f7f3e8;
}
.tv-header-meta {
  display: table-cell;
  vertical-align: middle;
  text-align: right;
  white-space: nowrap;
}
.tv-header-clock {
  display: inline-block;
  vertical-align: middle;
  margin: 0 12px 0 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 24px;
  font-size: var(--tv-24);
  font-weight: 600;
  color: #cfc6b0;
}
.tv-header-fs {
  display: inline-block;
  vertical-align: middle;
  border: 0;
  background: transparent;
  color: #e8c44a;
  padding: 8px;
  cursor: pointer;
  opacity: 0.5;
}
.tv-header-icon {
  width: 28px;
  height: 28px;
  color: #e8c44a;
}

.tv-slide {
  position: absolute;
  top: 64px;
  left: 0;
  width: 100%;
  height: 78%;
  display: block;
  box-sizing: border-box;
  padding: 20px 16px;
  text-align: center;
  color: #f7f3e8;
  overflow: hidden;
}
.tv-slide-kicker {
  display: block;
  margin: 0 auto 28px;
  font-size: 26px;
  font-size: var(--tv-28);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e8c44a;
}
.tv-slide-title {
  display: block;
  margin: 0 auto;
  font-family: var(--font-audience-display), Georgia, "Times New Roman", serif;
  font-size: 44px;
  font-size: var(--tv-48);
  font-weight: 700;
  color: #f7f3e8;
}
.tv-slide-sub {
  display: block;
  margin: 12px auto 0;
  font-size: 22px;
  font-size: var(--tv-24);
  color: #cfc6b0;
}

.tv-podium {
  display: block;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
  font-size: 0;
}
.tv-podium-card {
  display: inline-block;
  vertical-align: bottom;
  width: 30%;
  min-width: 200px;
  max-width: 340px;
  margin: 10px 12px;
  padding: 28px 20px;
  border-radius: 20px;
  background: #3a2550;
  box-sizing: border-box;
  text-align: center;
  font-size: 16px;
}
.tv-podium-card.is-leader {
  padding-top: 40px;
  padding-bottom: 36px;
  max-width: 380px;
  width: 34%;
}
.tv-podium-trophy {
  display: block;
  width: 88px;
  height: auto;
  margin: 0 auto 12px;
}
.tv-podium-trophy.is-leader {
  width: 120px;
}
.tv-podium-name {
  display: block;
  margin: 8px 0 0;
  font-family: var(--font-audience-display), Georgia, "Times New Roman", serif;
  font-size: 30px;
  font-size: var(--tv-32);
  font-weight: 700;
  color: #f7f3e8;
}
.tv-podium-card.is-leader .tv-podium-name {
  font-size: 38px;
  font-size: var(--tv-40);
}
.tv-podium-points {
  display: block;
  margin: 6px 0 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 44px;
  font-size: var(--tv-48);
  font-weight: 800;
  color: #e8c44a;
}
.tv-podium-card.is-leader .tv-podium-points {
  font-size: 64px;
  font-size: var(--tv-72);
}
.tv-podium-label {
  display: block;
  margin: 4px 0 0;
  font-size: 14px;
  font-size: var(--tv-16);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #cfc6b0;
}
.tv-rest {
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 28px auto 0;
  text-align: center;
  font-size: 0;
}
.tv-rest-chip {
  display: inline-block;
  vertical-align: middle;
  margin: 6px;
  padding: 10px 16px;
  border-radius: 14px;
  background: rgba(58, 37, 80, 0.75);
  font-size: 18px;
  font-size: var(--tv-20);
  color: #f7f3e8;
}
.tv-rest-rank {
  font-family: Consolas, "Courier New", monospace;
  font-weight: 700;
  color: #cfc6b0;
  margin-right: 8px;
}
.tv-rest-points {
  font-family: Consolas, "Courier New", monospace;
  font-weight: 700;
  color: #e8c44a;
  margin-left: 8px;
}

.tv-card-row {
  display: block;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
  font-size: 0;
}
.tv-card {
  position: relative;
  display: inline-block;
  vertical-align: top;
  width: 38%;
  min-width: 240px;
  max-width: 420px;
  margin: 12px;
  padding: 36px 28px;
  border-radius: 20px;
  background: #3a2550;
  box-sizing: border-box;
  text-align: center;
  font-size: 16px;
  overflow: hidden;
}
.tv-card-badge {
  display: inline-block;
  margin: 10px 0;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(232, 196, 74, 0.2);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e8c44a;
}
.tv-card-title {
  display: block;
  margin: 0;
  font-family: var(--font-audience-display), Georgia, "Times New Roman", serif;
  font-size: 34px;
  font-size: var(--tv-36);
  font-weight: 700;
  color: #f7f3e8;
}
.tv-card-sub {
  display: block;
  margin: 8px 0 0;
  font-size: 18px;
  font-size: var(--tv-20);
  color: #cfc6b0;
}
.tv-card-houses {
  display: block;
  margin: 10px 0 0;
  font-size: 15px;
  font-size: var(--tv-16);
  font-weight: 600;
  color: #e8c44a;
}
.tv-card-icon {
  display: inline-block;
  width: 64px;
  height: 64px;
  line-height: 64px;
  border-radius: 16px;
  background: rgba(232, 196, 74, 0.15);
  color: #e8c44a;
  text-align: center;
}
.tv-house-row {
  display: block;
  text-align: center;
  margin-bottom: 8px;
}
.tv-house-row .tv-photo {
  display: inline-block !important;
  vertical-align: middle;
  margin: 0 4px;
}

.tv-progress-row {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 2%;
  display: block;
  text-align: center;
  font-size: 0;
}
.tv-progress-seg {
  display: inline-block;
  vertical-align: middle;
  height: 8px;
  width: 64px;
  max-width: 10%;
  margin: 0 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(232, 196, 74, 0.2);
}
.tv-progress-fill {
  height: 100%;
  width: 100%;
  border-radius: 999px;
  background: #e8c44a;
}

#tv-stage img {
  max-width: 160px !important;
  max-height: 160px !important;
  object-fit: cover !important;
}
#tv-stage .tv-photo {
  display: inline-block !important;
  width: 96px !important;
  height: 96px !important;
  max-width: 96px !important;
  max-height: 96px !important;
  overflow: hidden !important;
  border-radius: 999px !important;
  border: 2px solid #3a2550;
  background: #2a1840;
  box-sizing: border-box;
  vertical-align: middle;
}
#tv-stage .tv-photo.is-leader {
  width: 120px !important;
  height: 120px !important;
  max-width: 120px !important;
  max-height: 120px !important;
}
#tv-stage .tv-photo img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: cover !important;
}
#tv-stage .tv-photo-hero {
  width: 100% !important;
  max-width: 280px !important;
  height: 200px !important;
  max-height: 200px !important;
  overflow: hidden !important;
  border-radius: 0 !important;
  background: #2a1840;
}
#tv-stage .tv-photo-hero img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: cover !important;
}
#tv-stage svg[viewBox="0 0 200 60"] {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 12vh !important;
  max-height: 140px !important;
  color: rgba(232, 196, 74, 0.12) !important;
  pointer-events: none !important;
}

#tv-boot-debug {
  position: fixed !important;
  top: 8px !important;
  left: 8px !important;
  z-index: 99999 !important;
  max-width: 92% !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  background: rgba(0,0,0,0.75) !important;
  color: #b8f55a !important;
  font: 11px/1.3 monospace !important;
  pointer-events: none !important;
  opacity: 0.55;
}
`.trim();
