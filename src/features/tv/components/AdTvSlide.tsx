import type { AdWithMedia } from "@/types/ad";

/**
 * TV ad slide — first media only, full-bleed contain. No React timers (Panasonic
 * does not hydrate); multi-media ads still get a full slide via meta-refresh rotation.
 * `.tv-ad` is exempt from the 160px thumbnail img cap in critical CSS.
 */
export function AdTvSlide({ ad }: { ad: AdWithMedia }) {
  const item = ad.media[0];
  if (!item) return null;

  return (
    <div className="tv-ad">
      <span className="tv-ad-sizer" aria-hidden="true" />
      {item.media_type === "video" ? (
        <video
          src={item.media_url}
          muted
          autoPlay
          loop
          playsInline
          controls={false}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.media_url} alt="" />
      )}
    </div>
  );
}
