"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CameraCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
};

/**
 * Live webcam/phone-camera capture for student photos. Falls back to a native
 * `capture` file input when getUserMedia is blocked (common on HTTP or after a
 * permission denial) so the admin still has a camera path.
 */
export function CameraCaptureDialog({ open, onOpenChange, onCapture }: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setReady(false);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        fileInputRef.current?.click();
        onOpenChange(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        toast.error("Could not open the camera. Check permission, or pick a photo from storage.");
        onOpenChange(false);
      }
    }

    void start();

    return () => {
      cancelled = true;
      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
  }, [open, facingMode, onOpenChange]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Could not capture that photo. Please try again.");
          return;
        }
        const file = new File([blob], `student-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        onOpenChange(false);
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleNativeCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onCapture(file);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take photo</DialogTitle>
          <DialogDescription>Use the device camera to capture the student photo.</DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleNativeCapture}
        />

        <div className="overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[3/4] w-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
          />
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFacingMode((mode) => (mode === "user" ? "environment" : "user"))}
          >
            <SwitchCamera className="size-3.5" data-icon="inline-start" />
            Flip
          </Button>
          <Button type="button" size="sm" onClick={handleCapture} disabled={!ready}>
            <Camera className="size-3.5" data-icon="inline-start" />
            Capture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
