/**
 * Plain CSS for /tv — table + inline-block only (Panasonic ignores flexbox).
 * Large hall-readable type; cards fill width; keep overflow hidden for chrome/overscan.
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

  --stage-spotlight-deep: #1a1028;
  --stage-spotlight-card: #3a2550;
  --stage-spotlight-ink: #f7f3e8;
  --stage-spotlight-ink-dim: #cfc6b0;
  --stage-spotlight-gold: #e8c44a;

  /* px fallback first, then vw for screens that honor it */
  --tv-12: 18px; --tv-12: 1.15vw;
  --tv-14: 22px; --tv-14: 1.35vw;
  --tv-16: 26px; --tv-16: 1.55vw;
  --tv-18: 30px; --tv-18: 1.8vw;
  --tv-20: 34px; --tv-20: 2.05vw;
  --tv-24: 42px; --tv-24: 2.5vw;
  --tv-28: 50px; --tv-28: 3vw;
  --tv-32: 58px; --tv-32: 3.45vw;
  --tv-36: 68px; --tv-36: 4vw;
  --tv-40: 80px; --tv-40: 4.7vw;
  --tv-48: 100px; --tv-48: 5.8vw;
  --tv-60: 120px; --tv-60: 7vw;
  --tv-64: 130px; --tv-64: 7.5vw;
  --tv-72: 148px; --tv-72: 8.5vw;
  --tv-96: 180px; --tv-96: 10.5vw;
  --tv-128: 220px; --tv-128: 12.5vw;
}
#tv-viewport,
#tv-stage {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  overflow: hidden !important;
  background: #1a1028 !important;
}
#tv-viewport { position: fixed !important; z-index: 1; }
#tv-stage-inner {
  position: absolute !important;
  top: 1% !important;
  right: 1.5% !important;
  bottom: 1% !important;
  left: 1.5% !important;
  color: #f7f3e8;
  font-size: 28px;
  font-family: var(--font-audience-ui), "Segoe UI", Tahoma, sans-serif;
  overflow: hidden !important;
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
  padding: 6px 12px;
  box-sizing: border-box;
}
.tv-header-brand,
.tv-header-meta {
  display: table-cell;
  vertical-align: middle;
  white-space: nowrap;
}
.tv-header-brand { text-align: left; }
.tv-header-meta { text-align: right; }
.tv-header-brand .tv-header-icon {
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
  width: 28px;
  height: 28px;
}
.tv-header-title {
  display: inline-block;
  vertical-align: middle;
  margin: 0;
  font-family: var(--font-audience-display), Georgia, serif;
  font-size: 28px;
  font-size: var(--tv-20);
  font-weight: 700;
  color: #f7f3e8;
}
.tv-header-clock {
  display: inline-block;
  vertical-align: middle;
  margin: 0 10px 0 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 26px;
  font-size: var(--tv-18);
  font-weight: 600;
  color: #cfc6b0;
}
.tv-header-fs {
  display: inline-block;
  vertical-align: middle;
  border: 0;
  background: transparent;
  color: #e8c44a;
  padding: 6px;
  opacity: 0.55;
}
.tv-header-icon { width: 28px; height: 28px; color: #e8c44a; }

/* Leave headroom for address bar + bottom toolbar on hall TVs (no fullscreen) */
.tv-slide {
  position: absolute;
  top: 40px;
  left: 0;
  width: 100%;
  height: 78%;
  display: block;
  box-sizing: border-box;
  padding: 2px 8px 8px;
  text-align: center;
  color: #f7f3e8;
  overflow: hidden;
}
.tv-slide-kicker {
  display: block;
  margin: 0 auto 10px;
  font-size: 34px;
  font-size: var(--tv-24);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e8c44a;
}
.tv-slide-title {
  display: block;
  margin: 0 auto 8px;
  font-family: var(--font-audience-display), Georgia, serif;
  font-size: 44px;
  font-size: var(--tv-32);
  font-weight: 700;
  color: #f7f3e8;
}
.tv-slide-sub {
  display: block;
  margin: 4px auto 10px;
  font-size: 24px;
  font-size: var(--tv-16);
  color: #cfc6b0;
}

.tv-podium {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 8px auto 0;
  text-align: center;
  font-size: 0;
  box-sizing: border-box;
  padding: 0 12px;
}
.tv-podium-card {
  display: block;
  width: 50%;
  max-width: 100%;
  margin: 10px auto;
  padding: 0;
  border-radius: 18px;
  background: #3a2550;
  box-sizing: border-box;
  text-align: left;
  font-size: 18px;
  overflow: hidden;
}
.tv-podium-card.is-leader {
  width: 50%;
  max-width: 100%;
  background: #452960;
  border: 2px solid rgba(232, 196, 74, 0.45);
}
.tv-podium-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.tv-podium-td-media,
.tv-podium-td-name,
.tv-podium-td-score {
  vertical-align: middle;
  padding: 12px 10px;
}
.tv-podium-td-media {
  width: 18%;
  text-align: center;
  white-space: nowrap;
  font-size: 0;
}
.tv-podium-td-name {
  width: 42%;
  text-align: left;
  padding-left: 8px;
}
.tv-podium-td-score {
  width: 40%;
  text-align: right;
  padding-right: 20px;
}
.tv-podium-trophy {
  display: inline-block;
  vertical-align: middle;
  width: 44px;
  height: auto;
  margin: 0 8px 0 0;
}
.tv-podium-trophy.is-leader { width: 52px; }
.tv-podium-name {
  display: block;
  margin: 0;
  font-family: var(--font-audience-display), Georgia, serif;
  font-size: 36px;
  font-size: var(--tv-28);
  font-weight: 700;
  color: #f7f3e8;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tv-podium-card.is-leader .tv-podium-name {
  font-size: 42px;
  font-size: var(--tv-32);
}
/* Cap score size so 3–4 digits always fit in the score column (PC + hall TV) */
.tv-podium-points {
  display: block;
  margin: 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 56px;
  font-size: 4.2vw;
  font-weight: 800;
  color: #e8c44a;
  line-height: 1;
  white-space: nowrap;
}
.tv-podium-card.is-leader .tv-podium-points {
  font-size: 64px;
  font-size: 4.8vw;
}
.tv-podium-label {
  display: block;
  margin: 4px 0 0;
  font-size: 16px;
  font-size: var(--tv-14);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #cfc6b0;
}
.tv-rest {
  display: block;
  width: 100%;
  margin: 12px auto 0;
  text-align: center;
  font-size: 0;
}
.tv-rest-chip {
  display: inline-block;
  vertical-align: middle;
  margin: 6px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(58, 37, 80, 0.75);
  font-size: 24px;
  font-size: var(--tv-18);
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
  margin: 0 auto;
  text-align: center;
  font-size: 0;
}
.tv-card {
  display: inline-block;
  vertical-align: top;
  width: 56%;
  min-width: 0;
  max-width: none;
  margin: 8px 1%;
  padding: 24px 24px;
  border-radius: 18px;
  background: #3a2550;
  box-sizing: border-box;
  text-align: center;
  font-size: 18px;
  overflow: hidden;
}
.tv-card-badge {
  display: inline-block;
  margin: 12px 0;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(232, 196, 74, 0.2);
  font-size: 20px;
  font-size: var(--tv-14);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #e8c44a;
}
.tv-card-title {
  display: block;
  margin: 0;
  font-family: var(--font-audience-display), Georgia, serif;
  font-size: 56px;
  font-size: var(--tv-40);
  font-weight: 700;
  color: #f7f3e8;
  line-height: 1.15;
}
.tv-card-sub {
  display: block;
  margin: 10px 0 0;
  font-size: 28px;
  font-size: var(--tv-20);
  color: #cfc6b0;
}
.tv-card-houses {
  display: block;
  margin: 12px 0 0;
  font-size: 24px;
  font-size: var(--tv-18);
  font-weight: 600;
  color: #e8c44a;
}
.tv-card-icon {
  display: inline-block;
  width: 72px;
  height: 72px;
  line-height: 72px;
  border-radius: 16px;
  background: rgba(232, 196, 74, 0.15);
  color: #e8c44a;
  text-align: center;
}
.tv-house-row {
  display: block;
  text-align: center;
  margin-bottom: 10px;
}
.tv-house-row .tv-photo {
  display: inline-block !important;
  vertical-align: middle;
  margin: 0 4px;
}

/* Festival status: many small category cards across the width */
.tv-card.tv-status-card {
  width: 18%;
  margin: 10px 0.8%;
  padding: 22px 14px;
}
.tv-card.tv-status-card .tv-card-sub {
  font-size: 18px;
  font-size: var(--tv-14);
  margin-bottom: 6px;
}
.tv-card.tv-status-card .tv-card-title {
  font-size: 36px;
  font-size: var(--tv-28);
}
.tv-status-bar {
  margin-top: 14px;
  height: 12px;
  border-radius: 999px;
  background: rgba(247,243,232,0.15);
  overflow: hidden;
}
.tv-status-bar > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #e8c44a;
}
.tv-status-pct {
  display: block;
  margin: 0 auto 4px;
  font-family: Consolas, "Courier New", monospace;
  font-size: 88px;
  font-size: var(--tv-64);
  font-weight: 800;
  color: #e8c44a;
  line-height: 1;
}

.tv-list {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  font-size: 0;
}
.tv-list-row {
  display: inline-block;
  vertical-align: top;
  width: 48%;
  min-width: 0;
  max-width: none;
  margin: 5px 1%;
  padding: 12px 16px;
  border-radius: 14px;
  background: #3a2550;
  box-sizing: border-box;
  text-align: left;
  font-size: 18px;
}
.tv-list-body {
  display: inline-block;
  vertical-align: middle;
  max-width: 58%;
}
.tv-list-name {
  display: block;
  margin: 0;
  font-family: var(--font-audience-display), Georgia, serif;
  font-size: 32px;
  font-size: var(--tv-24);
  font-weight: 700;
  color: #f7f3e8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tv-list-meta {
  display: block;
  margin: 4px 0 0;
  font-size: 22px;
  font-size: var(--tv-16);
  color: #cfc6b0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tv-list-badge {
  display: inline-block;
  vertical-align: middle;
  margin-left: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(232, 196, 74, 0.18);
  font-size: 20px;
  font-size: var(--tv-14);
  font-weight: 700;
  color: #e8c44a;
  white-space: nowrap;
}
.tv-list-medal {
  display: inline-block;
  vertical-align: middle;
  width: 44px;
  height: 44px;
  line-height: 44px;
  margin-right: 12px;
  border-radius: 12px;
  background: rgba(232, 196, 74, 0.15);
  color: #e8c44a;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
}

.tv-winner-card {
  display: inline-block;
  vertical-align: top;
  width: 30%;
  min-width: 0;
  max-width: none;
  margin: 10px 1.2%;
  border-radius: 18px;
  background: #3a2550;
  overflow: hidden;
  text-align: left;
  font-size: 18px;
}
.tv-winner-card .tv-photo-hero {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  height: 140px !important;
  max-height: 140px !important;
  border-radius: 0 !important;
}
.tv-winner-body { padding: 16px 18px 12px; }
.tv-winner-foot {
  padding: 12px 18px;
  background: rgba(232, 196, 74, 0.12);
  font-size: 24px;
  font-size: var(--tv-18);
  font-weight: 600;
  color: #e8c44a;
}

#tv-stage .tv-ad,
.tv-ad {
  position: absolute;
  top: 40px;
  left: 0;
  width: 100%;
  height: 78%;
  text-align: center;
  overflow: hidden;
  background: #1a1028;
}
#tv-stage .tv-ad img,
#tv-stage .tv-ad video {
  display: inline-block !important;
  vertical-align: middle;
  max-width: 100% !important;
  max-height: 100% !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  border: 0 !important;
}
#tv-stage .tv-ad-sizer,
.tv-ad-sizer {
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  width: 0;
}

.tv-progress-row {
  position: absolute;
  left: 3%;
  right: 3%;
  bottom: 0.5%;
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
  border: 3px solid #3a2550;
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
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  height: 140px !important;
  max-height: 140px !important;
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
#tv-stage .tv-list-row .tv-photo {
  width: 72px !important;
  height: 72px !important;
  max-width: 72px !important;
  max-height: 72px !important;
  margin-right: 14px;
}
#tv-stage .tv-podium-card .tv-photo {
  display: inline-block !important;
  width: 68px !important;
  height: 68px !important;
  max-width: 68px !important;
  max-height: 68px !important;
  margin: 0;
  vertical-align: middle;
}
#tv-stage .tv-podium-card.is-leader .tv-photo {
  width: 76px !important;
  height: 76px !important;
  max-width: 76px !important;
  max-height: 76px !important;
}
#tv-stage .tv-podium-td-media .tv-photo {
  display: inline-block !important;
  vertical-align: middle;
}
#tv-stage .tv-ad img,
#tv-stage .tv-ad video {
  max-width: 100% !important;
  max-height: 100% !important;
}

/* Dome decorative — keep small */
#tv-stage svg[viewBox="0 0 200 60"] {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 40px !important;
  max-height: 40px !important;
  color: rgba(232, 196, 74, 0.08) !important;
  pointer-events: none !important;
  z-index: 0;
}

#tv-boot-debug {
  display: none !important;
}
`.trim();
