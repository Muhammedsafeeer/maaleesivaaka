/* /tv debug only — slideshow uses <meta http-equiv="refresh"> (no JS required). */
(function () {
  function paint() {
    var el = document.getElementById("tv-boot-debug");
    if (!el) return;
    var root = document.getElementById("tv-slides");
    var count = root ? root.getAttribute("data-tv-slide-count") : "?";
    var active = root ? root.getAttribute("data-tv-slide-active") : "?";
    var meta = document.querySelector('meta[http-equiv="refresh"]');
    el.textContent =
      "tv · slide " +
      active +
      "/" +
      count +
      " · meta " +
      (meta ? meta.getAttribute("content") : "MISSING") +
      " · " +
      String(navigator.userAgent || "").slice(0, 40);
  }

  function boot() {
    paint();
    setTimeout(paint, 200);
    setTimeout(paint, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
