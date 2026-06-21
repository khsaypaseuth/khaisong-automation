import { getSettingsMap } from "./service";

export type ResolvedKeys = {
  textProvider: string; // requested: "openai" | "gemini"
  imageProvider: string; // requested: "openai" | "gemini"
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiTtsModel: string;
  geminiTextModel: string;
  geminiImageModel: string;
  imageKey: string; // OpenAI image key (separate from chat key if set)
  imageModel: string; // OpenAI image model
};

/**
 * Resolves provider API keys, preferring values saved in the Settings table and
 * falling back to environment variables. Models + provider choice stay
 * env-configured.
 */
export async function resolveKeys(): Promise<ResolvedKeys> {
  const s = await getSettingsMap();
  return {
    textProvider: (process.env.TEXT_PROVIDER || "openai").toLowerCase(),
    imageProvider: (process.env.IMAGE_PROVIDER || "openai").toLowerCase(),
    openaiKey: s.openai_api_key || process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    geminiKey: s.gemini_api_key || process.env.GEMINI_API_KEY || "",
    geminiTtsModel: process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
    geminiTextModel: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
    geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
    imageKey:
      s.image_provider_api_key ||
      process.env.IMAGE_PROVIDER_API_KEY ||
      s.openai_api_key ||
      process.env.OPENAI_API_KEY ||
      "",
    imageModel: process.env.IMAGE_PROVIDER_MODEL || "gpt-image-1",
  };
}

/** Picks the active text provider, honoring the request then falling back to
 * whichever key is available. Returns null if nothing is configured. */
export function selectTextProvider(keys: ResolvedKeys): "openai" | "gemini" | null {
  if (keys.textProvider === "gemini" && keys.geminiKey) return "gemini";
  if (keys.textProvider === "openai" && keys.openaiKey) return "openai";
  if (keys.openaiKey) return "openai";
  if (keys.geminiKey) return "gemini";
  return null;
}

/** Picks the active image provider, same fallback logic. */
export function selectImageProvider(keys: ResolvedKeys): "openai" | "gemini" | null {
  if (keys.imageProvider === "gemini" && keys.geminiKey) return "gemini";
  if (keys.imageProvider === "openai" && keys.imageKey) return "openai";
  if (keys.imageKey) return "openai";
  if (keys.geminiKey) return "gemini";
  return null;
}
