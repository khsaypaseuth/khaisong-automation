"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CalendarRowActions({
  videoId,
  approvalStatus,
  hasVideo,
}: {
  videoId: string;
  approvalStatus: string;
  hasVideo: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `Failed to ${action}`);
        return;
      }
      toast.success(action === "approve" ? "Approved" : "Rejected");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        size="xs"
        variant="ghost"
        disabled={busy || approvalStatus === "REJECTED"}
        onClick={() => act("reject")}
      >
        Reject
      </Button>
      <Button
        size="xs"
        disabled={busy || !hasVideo || approvalStatus === "APPROVED"}
        onClick={() => act("approve")}
      >
        Approve
      </Button>
    </div>
  );
}
