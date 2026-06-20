"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateScriptsButton({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(status === "GENERATING_SCRIPTS");

  // Poll while generation is running, then refresh the page data.
  useEffect(() => {
    if (!busy) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data.status !== "GENERATING_SCRIPTS") {
          setBusy(false);
          clearInterval(interval);
          if (data.status === "FAILED") {
            toast.error("Script generation failed. Check the logs.");
          } else {
            toast.success("Scripts generated");
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
  }, [busy, campaignId, router]);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/generate-scripts`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to start generation");
        setBusy(false);
        return;
      }
      toast.info("Generating scripts…");
      router.refresh();
    } catch {
      toast.error("Failed to start generation");
      setBusy(false);
    }
  }

  const label =
    status === "DRAFT" || status === "FAILED"
      ? "Generate scripts"
      : "Regenerate scripts";

  return (
    <Button onClick={generate} disabled={busy}>
      {busy ? "Generating…" : label}
    </Button>
  );
}
