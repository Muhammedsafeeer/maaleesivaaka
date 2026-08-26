/* Reports panel size on /tv. Scaling is CSS (vmin) — this file must not transform the stage. */
(function () {
  function paint() {
    var el = document.getElementById("tv-boot-debug");
    var stage = document.getElementById("tv-stage");
    var viewport = document.getElementById("tv-viewport");
    if (!el) return;
    if (!stage && !viewport) {
      el.textContent = "tv-fit loaded · waiting for stage…";
      return;
    }
    var w =
      (viewport && viewport.clientWidth) ||
      document.documentElement.clientWidth ||
      window.innerWidth ||
      0;
    var h =
      (viewport && viewport.clientHeight) ||
      document.documentElement.clientHeight ||
      window.innerHeight ||
      0;
    var sr = stage ? stage.getBoundingClientRect() : null;
    el.textContent =
      "tv ok · panel " +
      Math.round(w) +
      "x" +
      Math.round(h) +
      " · stage " +
      (sr ? Math.round(sr.width) + "x" + Math.round(sr.height) : "n/a") +
      " · dpr " +
      (window.devicePixelRatio || 1) +
      " · " +
      String(navigator.userAgent || "").slice(0, 56);
  }

  function boot() {
    paint();
    setTimeout(paint, 100);
    setTimeout(paint, 500);
    setTimeout(paint, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("resize", paint);
  window.__tvFit = paint;
})();
