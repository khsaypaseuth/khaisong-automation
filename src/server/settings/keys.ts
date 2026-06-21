import { getSettingsMap } from "./service";

export type ResolvedKeys = {
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiModel: string;
  imageProvider: string;
  imageKey: string;
  imageModel: string;
};

/**
 * Resolves provider API keys, preferring values saved in the Settings table and
 * falling back to environment variables. Models stay env-configured.
 */
export async function resolveKeys(): Promise<ResolvedKeys> {
  const s = await getSettingsMap();
  return {
    openaiKey: s.openai_api_key || process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    geminiKey: s.gemini_api_key || process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
    imageProvider: (process.env.IMAGE_PROVIDER || "openai").toLowerCase(),
    imageKey:
      s.image_provider_api_key ||
      process.env.IMAGE_PROVIDER_API_KEY ||
      s.openai_api_key ||
      process.env.OPENAI_API_KEY ||
      "",
    imageModel: process.env.IMAGE_PROVIDER_MODEL || "gpt-image-1",
  };
}
