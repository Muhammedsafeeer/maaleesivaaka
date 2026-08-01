"use client";

import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/hooks/useFullscreen";

export function FullscreenToggle() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleFullscreen}
      className="border-(--stage-gold) bg-transparent text-(--stage-gold-bright) hover:bg-(--stage-gold)/10 hover:text-(--stage-gold-bright)"
    >
      {isFullscreen ? (
        <Minimize className="size-4" data-icon="inline-start" />
      ) : (
        <Maximize className="size-4" data-icon="inline-start" />
      )}
      {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
    </Button>
  );
}
