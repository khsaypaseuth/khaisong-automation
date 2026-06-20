import { prisma } from "@/lib/db";

/** Settings the admin can edit. API-key values are stored but unused in Phase 1. */
export const SETTING_KEYS = [
  "openai_api_key",
  "gemini_api_key",
  "image_provider_api_key",
  "facebook_page_id",
  "facebook_access_token",
  "tiktok_client_key",
  "default_brand_color",
  "default_logo_url",
  "default_background_music_url",
  "default_output_language",
  "default_posting_time",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value ?? "";
  return map;
}

export async function upsertSettings(values: Record<string, string>) {
  const entries = Object.entries(values).filter(([key]) =>
    (SETTING_KEYS as readonly string[]).includes(key),
  );

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );

  return getSettingsMap();
}
