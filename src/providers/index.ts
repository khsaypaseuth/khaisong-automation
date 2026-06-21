// Central provider registry. Resolves keys from the Settings table (falling
// back to env) and returns the configured implementation, or a NotImplemented
// stub when unconfigured. Later phases swap implementations without touching
// call sites.

import { NotImplementedTextProvider, type TextProvider } from "./text/TextProvider";
import { OpenAITextProvider } from "./text/OpenAITextProvider";
import {
  NotImplementedImageProvider,
  type ImageGenerationProvider,
} from "./image/ImageGenerationProvider";
import { OpenAIImageProvider } from "./image/OpenAIImageProvider";
import { NotImplementedTTSProvider, type TTSProvider } from "./tts/TTSProvider";
import { GeminiTTSProvider } from "./tts/GeminiTTSProvider";
import { type VideoRenderer } from "./video/VideoRenderer";
import { FFmpegVideoRenderer } from "./video/FFmpegVideoRenderer";
import { resolveKeys } from "@/server/settings/keys";

export async function getTextProvider(): Promise<TextProvider> {
  const { openaiKey, openaiModel } = await resolveKeys();
  if (openaiKey) return new OpenAITextProvider(openaiKey, openaiModel);
  return new NotImplementedTextProvider();
}

export async function getImageProvider(): Promise<ImageGenerationProvider> {
  const { imageProvider, imageKey, imageModel } = await resolveKeys();
  if (imageProvider === "openai" && imageKey) {
    return new OpenAIImageProvider(imageKey, imageModel);
  }
  return new NotImplementedImageProvider();
}

export async function getTTSProvider(): Promise<TTSProvider> {
  const { geminiKey, geminiModel } = await resolveKeys();
  if (geminiKey) return new GeminiTTSProvider(geminiKey, geminiModel);
  return new NotImplementedTTSProvider();
}

export function getVideoRenderer(): VideoRenderer {
  return new FFmpegVideoRenderer();
}
