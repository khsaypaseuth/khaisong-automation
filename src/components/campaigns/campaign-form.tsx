"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LANGUAGES, PLATFORM_LABELS } from "@/lib/labels";
import { PLATFORMS } from "@/lib/validations/campaign";

export type CampaignFormValues = {
  title: string;
  goalPrompt: string;
  postsPerDay: number;
  numberOfDays: number;
  language: string;
  tone: string;
  targetAudience: string;
  platforms: string[];
};

const DEFAULTS: CampaignFormValues = {
  title: "",
  goalPrompt: "",
  postsPerDay: 2,
  numberOfDays: 3,
  language: "Lao",
  tone: "Helpful, trustworthy, simple, professional",
  targetAudience: "",
  platforms: ["FACEBOOK", "TIKTOK"],
};

export function CampaignForm({
  campaignId,
  initial,
}: {
  campaignId?: string;
  initial?: Partial<CampaignFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CampaignFormValues>({
    ...DEFAULTS,
    ...initial,
  });
  const [loading, setLoading] = useState(false);

  const totalPosts = values.postsPerDay * values.numberOfDays;
  const isEdit = Boolean(campaignId);

  function set<K extends keyof CampaignFormValues>(
    key: K,
    value: CampaignFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function togglePlatform(p: string) {
    setValues((v) => ({
      ...v,
      platforms: v.platforms.includes(p)
        ? v.platforms.filter((x) => x !== p)
        : [...v.platforms, p],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/campaigns/${campaignId}` : "/api/campaigns",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            targetAudience: values.targetAudience || null,
          }),
        },
      );
      if (!res.ok) {
        toast.error(isEdit ? "Failed to update campaign" : "Failed to create campaign");
        return;
      }
      const data = await res.json();
      toast.success(isEdit ? "Campaign updated" : "Campaign created");
      router.push(`/campaigns/${isEdit ? campaignId : data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign title</Label>
            <Input
              id="title"
              required
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Khaisong China→Laos Trust Campaign"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalPrompt">Goal prompt</Label>
            <Textarea
              id="goalPrompt"
              required
              rows={6}
              value={values.goalPrompt}
              onChange={(e) => set("goalPrompt", e.target.value)}
              placeholder="Promote Khaisong as a trusted procurement and freight forwarding service from China to Laos…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postsPerDay">Posts per day</Label>
              <Input
                id="postsPerDay"
                type="number"
                min={1}
                max={20}
                value={values.postsPerDay}
                onChange={(e) => set("postsPerDay", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfDays">Number of days</Label>
              <Input
                id="numberOfDays"
                type="number"
                min={1}
                max={60}
                value={values.numberOfDays}
                onChange={(e) => set("numberOfDays", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-md bg-muted px-4 py-3 text-sm">
            Total posts to generate:{" "}
            <span className="font-semibold">{totalPosts || 0}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={values.language}
                onValueChange={(v) => set("language", (v as string) ?? "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Input
                id="tone"
                value={values.tone}
                onChange={(e) => set("tone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target audience</Label>
            <Textarea
              id="targetAudience"
              rows={2}
              value={values.targetAudience}
              onChange={(e) => set("targetAudience", e.target.value)}
              placeholder="Lao business owners, online sellers, shop owners, SMEs…"
            />
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => {
                const active = values.platforms.includes(p);
                return (
                  <Button
                    key={p}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlatform(p)}
                  >
                    {PLATFORM_LABELS[p]}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
