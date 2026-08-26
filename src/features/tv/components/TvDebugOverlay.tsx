"use client";

import { useEffect, useState } from "react";

type DebugInfo = {
  windowSize: string;
  visualViewport: string;
  screenSize: string;
  documentClient: string;
  viewportBox: string;
  stageBox: string;
  stageTransform: string;
  tvScale: string;
  tvAvail: string;
  tvFit: string;
  tv24: string;
  devicePixelRatio: number;
  userAgent: string;
};

function readDebugInfo(): DebugInfo {
  const vv = window.visualViewport;
  const viewport = document.querySelector<HTMLElement>(".tv-viewport");
  const stage = document.querySelector<HTMLElement>(".tv-stage");
  const stageStyle = stage ? getComputedStyle(stage) : null;
  const vr = viewport?.getBoundingClientRect();
  const sr = stage?.getBoundingClientRect();
  return {
    windowSize: `${window.innerWidth} x ${window.innerHeight}`,
    visualViewport: vv
      ? `${vv.width.toFixed(0)} x ${vv.height.toFixed(0)} (scale ${vv.scale.toFixed(2)})`
      : "unsupported",
    screenSize: `${window.screen.width} x ${window.screen.height}`,
    documentClient: `${document.documentElement.clientWidth} x ${document.documentElement.clientHeight}`,
    viewportBox: vr ? `${vr.width.toFixed(0)} x ${vr.height.toFixed(0)}` : "n/a",
    stageBox: sr ? `${sr.width.toFixed(0)} x ${sr.height.toFixed(0)}` : "n/a",
    stageTransform: stageStyle?.transform || "n/a",
    tvScale: stage?.dataset.tvScale ?? "n/a",
    tvAvail: stage?.dataset.tvAvail ?? "n/a",
    tvFit: stage?.dataset.tvFit ?? "n/a",
    tv24: stageStyle?.getPropertyValue("--tv-24").trim() || "n/a",
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
  };
}

/**
 * Always-on compact scale chip so a real TV (no DevTools) can confirm fit.
 * Full panel with `?debug=1`.
 */
export function TvDebugOverlay() {
  const [info, setInfo] = useState<DebugInfo | null>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    setFull(new URLSearchParams(window.location.search).get("debug") === "1");
    function update() {
      setInfo(readDebugInfo());
    }
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.clearInterval(timer);
    };
  }, []);

  if (!info) return null;

  if (!full) {
    return (
      <div
        className="absolute top-2 left-2 z-50 rounded bg-black/80 px-2 py-1 font-mono text-lime-300"
        style={{ fontSize: 12, lineHeight: 1.3 }}
      >
        scale {info.tvScale} · {info.tvFit} · stage {info.stageBox} · avail {info.tvAvail}
      </div>
    );
  }

  return (
    <div
      className="absolute top-2 left-2 z-50 max-w-[min(90%,28rem)] rounded-md bg-black/85 p-3 font-mono leading-relaxed text-lime-300 shadow-lg"
      style={{ fontSize: 11 }}
    >
      <p className="mb-1 font-bold text-white">TV DEBUG (?debug=1)</p>
      <p>window: {info.windowSize}</p>
      <p>visualViewport: {info.visualViewport}</p>
      <p>screen: {info.screenSize}</p>
      <p>documentElement: {info.documentClient}</p>
      <p className="text-yellow-300">.tv-viewport box: {info.viewportBox}</p>
      <p className="text-yellow-300">.tv-stage box (post-scale): {info.stageBox}</p>
      <p className="text-yellow-300">transform: {info.stageTransform}</p>
      <p className="text-yellow-300">fit: {info.tvFit} @ {info.tvScale}</p>
      <p className="text-yellow-300">avail used: {info.tvAvail}</p>
      <p>--tv-24: {info.tv24}</p>
      <p>devicePixelRatio: {info.devicePixelRatio}</p>
      <p className="mt-1 max-w-full break-words text-white/70">UA: {info.userAgent}</p>
    </div>
  );
}
