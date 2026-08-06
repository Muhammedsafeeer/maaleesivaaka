import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { listAds } from "@/lib/services/ad.service";
import { AdList } from "@/features/ads/components/AdList";
import { CreateAdButton } from "@/features/ads/components/CreateAdButton";
import { AD_SLOT_COUNT } from "@/constants/ads";

export const metadata: Metadata = {
  title: "Ads",
};

export default async function AdsPage() {
  const ads = await listAds();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Megaphone className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-medium">Ads</h1>
            <p className="text-sm text-muted-foreground">
              Posters and videos shown on the audience page. Drag to reorder — the first{" "}
              {AD_SLOT_COUNT} ads each take one of the fixed slots between sections; the
              rest don&apos;t show until they&apos;re dragged into range.
            </p>
          </div>
        </div>
        <CreateAdButton />
      </div>

      <AdList ads={ads} />
    </div>
  );
}
