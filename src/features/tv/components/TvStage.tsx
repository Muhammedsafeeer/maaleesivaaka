/**
 * Fills the real screen edge-to-edge for the background, but insets its content by a
 * small viewport-relative margin — plain CSS, not a measurement of anything — so a
 * TV's overscan crop (many TVs trim a few percent off every HDMI edge by default,
 * "Just Scan"/"Screen Fit" is usually the setting that disables it) removes background,
 * not real content. Everything inside is sized with the `.tv-shell` fluid scale
 * (globals.css) rather than fixed px or a JS-computed transform: scale() — no
 * measurement of window.innerWidth/visualViewport at all, so there's nothing for a
 * given TV browser's viewport-reporting quirks to get wrong. The browser's own layout
 * engine resolves vw/vh/clamp() from the true visual viewport natively.
 */
export function TvStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-(--stage-spotlight-deep)">
      <div className="absolute inset-x-[3vw] inset-y-[3vh]">{children}</div>
    </div>
  );
}
