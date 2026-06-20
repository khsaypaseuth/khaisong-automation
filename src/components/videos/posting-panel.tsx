"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_LABELS } from "@/lib/labels";

type Props = {
  videoId: string;
  approved: boolean;
  videoUrl: string | null;
  platforms: string[]; // target platforms
  captions: Record<string, string>; // platform -> caption
  postedPlatforms: string[];
};

const ALL_PLATFORMS = ["FACEBOOK", "TIKTOK"];

export function PostingPanel({
  videoId,
  approved,
  videoUrl,
  platforms,
  captions,
  postedPlatforms,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const targets = platforms.length > 0 ? platforms : ALL_PLATFORMS;

  async function copyCaption(platform: string) {
    const text = captions[platform] ?? "";
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${PLATFORM_LABELS[platform]} caption copied`);
    } catch {
      toast.error("Clipboard not available");
    }
  }

  async function postViaApi(platform: string) {
    setBusy(platform);
    try {
      const slug = platform.toLowerCase();
      const res = await fetch(`/api/videos/${videoId}/post/${slug}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `Failed to post to ${PLATFORM_LABELS[platform]}`);
        return;
      }
      toast.success(`Posting to ${PLATFORM_LABELS[platform]}…`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function markPosted(platform: string) {
    setBusy(platform);
    try {
      const res = await fetch(`/api/videos/${videoId}/mark-posted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to mark as posted");
        return;
      }
      toast.success(`Marked posted on ${PLATFORM_LABELS[platform]}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual posting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!approved ? (
          <p className="text-sm text-muted-foreground">
            Approve the video to enable posting.
          </p>
        ) : (
          <>
            {videoUrl && (
              <Button
                variant="outline"
                size="sm"
                render={<a href={videoUrl} download />}
              >
                Download MP4
              </Button>
            )}
            <div className="divide-y rounded-md border">
              {targets.map((platform) => {
                const posted = postedPlatforms.includes(platform);
                return (
                  <div
                    key={platform}
                    className="flex items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {PLATFORM_LABELS[platform] ?? platform}
                      </span>
                      {posted && <Badge>Posted</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCaption(platform)}
                      >
                        Copy caption
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy === platform || posted}
                        onClick={() => postViaApi(platform)}
                      >
                        Post via API
                      </Button>
                      <Button
                        size="sm"
                        variant={posted ? "outline" : "default"}
                        disabled={busy === platform || posted}
                        onClick={() => markPosted(platform)}
                      >
                        {posted ? "Done" : "Mark posted"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
