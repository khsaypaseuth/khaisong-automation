"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateImagesButton({
  videoId,
  status,
  hasScenes,
}: {
  videoId: string;
  status: string;
  hasScenes: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(status === "GENERATING_IMAGES");

  useEffect(() => {
    if (!busy) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data.status !== "GENERATING_IMAGES") {
          setBusy(false);
          clearInterval(interval);
          if (data.status === "FAILED") {
            toast.error("Image generation failed. Check the logs.");
          } else {
            toast.success("Images generated");
          }
          router.refresh();
        }
      } catch {
        // transient — keep polling
      }
    }, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [busy, videoId, router]);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/generate-images`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to start image generation");
        setBusy(false);
        return;
      }
      toast.info("Generating images…");
      router.refresh();
    } catch {
      toast.error("Failed to start image generation");
      setBusy(false);
    }
  }

  return (
    <Button onClick={generate} disabled={busy || !hasScenes} size="sm">
      {busy
        ? "Generating…"
        : status === "IMAGES_GENERATED"
          ? "Regenerate images"
          : "Generate images"}
    </Button>
  );
}
