"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateVoiceButton({
  videoId,
  status,
  hasScript,
  hasVoice,
}: {
  videoId: string;
  status: string;
  hasScript: boolean;
  hasVoice: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(status === "GENERATING_VOICE");

  useEffect(() => {
    if (!busy) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data.status !== "GENERATING_VOICE") {
          setBusy(false);
          clearInterval(interval);
          if (data.status === "FAILED") {
            toast.error("Voice generation failed. Check the logs.");
          } else {
            toast.success("Voice generated");
          }
          router.refresh();
        }
      } catch {
        // transient — keep polling
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [busy, videoId, router]);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/generate-voice`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to start voice generation");
        setBusy(false);
        return;
      }
      toast.info("Generating voice…");
      router.refresh();
    } catch {
      toast.error("Failed to start voice generation");
      setBusy(false);
    }
  }

  return (
    <Button onClick={generate} disabled={busy || !hasScript} size="sm">
      {busy ? "Generating…" : hasVoice ? "Regenerate voice" : "Generate voice"}
    </Button>
  );
}
