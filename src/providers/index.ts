// Central provider registry. Phase 1 wires NotImplemented stubs; later phases
// swap in real implementations (OpenAI, Gemini TTS, Nano Banana, FFmpeg, …)
// without touching call sites.

import { NotImplementedTextProvider, type TextProvider } from "./text/TextProvider";
import { OpenAITextProvider } from "./text/OpenAITextProvider";
import {
  NotImplementedImageProvider,
  type ImageGenerationProvider,
} from "./image/ImageGenerationProvider";
import { NotImplementedTTSProvider, type TTSProvider } from "./tts/TTSProvider";
import {
  NotImplementedVideoRenderer,
  type VideoRenderer,
} from "./video/VideoRenderer";
import {
  NotImplementedSocialPoster,
  type SocialPlatform,
  type SocialPoster,
} from "./social/SocialPoster";

export function getTextProvider(): TextProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    return new OpenAITextProvider(apiKey, model);
  }
  return new NotImplementedTextProvider();
}

export function getImageProvider(): ImageGenerationProvider {
  return new NotImplementedImageProvider();
}

export function getTTSProvider(): TTSProvider {
  return new NotImplementedTTSProvider();
}

export function getVideoRenderer(): VideoRenderer {
  return new NotImplementedVideoRenderer();
}

export function getSocialPoster(platform: SocialPlatform): SocialPoster {
  return new NotImplementedSocialPoster(platform);
}
