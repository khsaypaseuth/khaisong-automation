"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusVariant, titleCase } from "@/lib/labels";

type Props = {
  videoId: string;
  approvalStatus: string;
  hasVideo: boolean;
  initial: {
    captionFacebook: string;
    captionTiktok: string;
    hashtags: string;
    scheduledDate: string; // yyyy-mm-dd or ""
    scheduledTime: string; // HH:mm or ""
  };
};

export function ReviewPanel({ videoId, approvalStatus, hasVideo, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captionFacebook: values.captionFacebook,
          captionTiktok: values.captionTiktok,
          hashtags: values.hashtags
            .split(/[\s,]+/)
            .map((h) => h.trim())
            .filter(Boolean),
          scheduledDate: values.scheduledDate || null,
          scheduledTime: values.scheduledTime || null,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to save changes");
        return;
      }
      toast.success("Saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function act(action: "approve" | "reject") {
    setActing(true);
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
      setActing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Review &amp; approval</CardTitle>
        <Badge variant={statusVariant(approvalStatus)}>
          {titleCase(approvalStatus)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cfb">Facebook caption</Label>
          <Textarea
            id="cfb"
            rows={3}
            value={values.captionFacebook}
            onChange={(e) => set("captionFacebook", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctt">TikTok caption</Label>
          <Textarea
            id="ctt"
            rows={3}
            value={values.captionTiktok}
            onChange={(e) => set("captionTiktok", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Hashtags</Label>
          <Input
            id="tags"
            value={values.hashtags}
            onChange={(e) => set("hashtags", e.target.value)}
            placeholder="#Khaisong #ChinaToLaos"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sd">Scheduled date</Label>
            <Input
              id="sd"
              type="date"
              value={values.scheduledDate}
              onChange={(e) => set("scheduledDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st">Scheduled time</Label>
            <Input
              id="st"
              type="time"
              value={values.scheduledTime}
              onChange={(e) => set("scheduledTime", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={save} disabled={saving} variant="outline">
            {saving ? "Saving…" : "Save edits"}
          </Button>
          <div className="flex-1" />
          <Button
            onClick={() => act("reject")}
            disabled={acting || approvalStatus === "REJECTED"}
            variant="destructive"
          >
            Reject
          </Button>
          <Button
            onClick={() => act("approve")}
            disabled={acting || !hasVideo || approvalStatus === "APPROVED"}
          >
            Approve
          </Button>
        </div>
        {!hasVideo && (
          <p className="text-xs text-muted-foreground">
            Render the video before approving.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
