"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Field = { key: string; label: string; secret?: boolean; placeholder?: string };

const GROUPS: { title: string; note?: string; fields: Field[] }[] = [
  {
    title: "AI provider keys",
    note: "Stored now, used in later phases. Not validated yet.",
    fields: [
      { key: "openai_api_key", label: "OpenAI API key", secret: true },
      { key: "gemini_api_key", label: "Gemini API key", secret: true },
      { key: "image_provider_api_key", label: "Image provider API key", secret: true },
    ],
  },
  {
    title: "Posting (Phase 8)",
    fields: [
      { key: "facebook_page_id", label: "Facebook Page ID" },
      { key: "facebook_access_token", label: "Facebook access token", secret: true },
      { key: "tiktok_client_key", label: "TikTok client key", secret: true },
    ],
  },
  {
    title: "Brand defaults",
    fields: [
      { key: "default_brand_color", label: "Brand color", placeholder: "#0F62FE" },
      { key: "default_logo_url", label: "Logo URL" },
      { key: "default_background_music_url", label: "Background music URL" },
      { key: "default_output_language", label: "Default language", placeholder: "Lao" },
      { key: "default_posting_time", label: "Default posting time", placeholder: "18:00" },
    ],
  },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        toast.error("Failed to save settings");
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
            {group.note && (
              <p className="text-xs text-muted-foreground">{group.note}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {group.fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.secret ? "password" : "text"}
                  autoComplete="off"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
