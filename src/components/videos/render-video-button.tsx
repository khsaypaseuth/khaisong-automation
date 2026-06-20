"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RenderVideoButton({
  videoId,
  status,
  ready,
  hasVideo,
}: {
  videoId: string;
  status: string;
  ready: boolean;
  hasVideo: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(status === "RENDERING");

  useEffect(() => {
    if (!busy) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data.status !== "RENDERING") {
          setBusy(false);
          clearInterval(interval);
          if (data.status === "FAILED") {
            toast.error("Rendering failed. Check the logs.");
          } else {
            toast.success("Video rendered");
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

  async function render() {
    setBusy(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/render`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to start rendering");
        setBusy(false);
        return;
      }
      toast.info("Rendering video…");
      router.refresh();
    } catch {
      toast.error("Failed to start rendering");
      setBusy(false);
    }
  }

  return (
    <Button onClick={render} disabled={busy || !ready} size="sm">
      {busy ? "Rendering…" : hasVideo ? "Re-render video" : "Render video"}
    </Button>
  );
}
