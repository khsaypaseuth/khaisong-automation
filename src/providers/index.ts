// Central provider registry. Resolves keys from the Settings table (falling
// back to env), picks the active provider, and returns the implementation — or
// a NotImplemented stub when unconfigured.

import { NotImplementedTextProvider, type TextProvider } from "./text/TextProvider";
import { OpenAITextProvider } from "./text/OpenAITextProvider";
import { GeminiTextProvider } from "./text/GeminiTextProvider";
import {
  NotImplementedImageProvider,
  type ImageGenerationProvider,
} from "./image/ImageGenerationProvider";
import { OpenAIImageProvider } from "./image/OpenAIImageProvider";
import { GeminiImageProvider } from "./image/GeminiImageProvider";
import { NotImplementedTTSProvider, type TTSProvider } from "./tts/TTSProvider";
import { GeminiTTSProvider } from "./tts/GeminiTTSProvider";
import { type VideoRenderer } from "./video/VideoRenderer";
import { FFmpegVideoRenderer } from "./video/FFmpegVideoRenderer";
import {
  resolveKeys,
  selectTextProvider,
  selectImageProvider,
} from "@/server/settings/keys";

export async function getTextProvider(): Promise<TextProvider> {
  const keys = await resolveKeys();
  switch (selectTextProvider(keys)) {
    case "gemini":
      return new GeminiTextProvider(keys.geminiKey, keys.geminiTextModel);
    case "openai":
      return new OpenAITextProvider(keys.openaiKey, keys.openaiModel);
    default:
      return new NotImplementedTextProvider();
  }
}

export async function getImageProvider(): Promise<ImageGenerationProvider> {
  const keys = await resolveKeys();
  switch (selectImageProvider(keys)) {
    case "gemini":
      return new GeminiImageProvider(keys.geminiKey, keys.geminiImageModel);
    case "openai":
      return new OpenAIImageProvider(keys.imageKey, keys.imageModel);
    default:
      return new NotImplementedImageProvider();
  }
}

export async function getTTSProvider(): Promise<TTSProvider> {
  const { geminiKey, geminiTtsModel } = await resolveKeys();
  if (geminiKey) return new GeminiTTSProvider(geminiKey, geminiTtsModel);
  return new NotImplementedTTSProvider();
}

export function getVideoRenderer(): VideoRenderer {
  return new FFmpegVideoRenderer();
}
