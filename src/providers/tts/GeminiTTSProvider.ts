import { GoogleGenAI } from "@google/genai";
import { pcmToWav, pcmDurationSeconds, parsePcmRate } from "@/lib/audio";
import type { TTSOptions, TTSProvider, TTSResult } from "./TTSProvider";

const DEFAULT_VOICE = "Kore";

/** Per-language voice override from env (GEMINI_TTS_VOICE_LAO, etc.). */
function voiceForLanguage(language: string): string {
  const key = `GEMINI_TTS_VOICE_${language.trim().toUpperCase()}`;
  return process.env[key] || process.env.GEMINI_TTS_VOICE_DEFAULT || DEFAULT_VOICE;
}

export class GeminiTTSProvider implements TTSProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateSpeech(text: string, options: TTSOptions): Promise<TTSResult> {
    const voiceName = options.voiceName || voiceForLanguage(options.language);

    // Gemini TTS (preview) intermittently returns finishReason OTHER with no
    // audio, or a transient 429/400. Retry a few times with backoff.
    const maxAttempts = 5;
    let lastError = "no audio data";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.find(
          (p) => p.inlineData?.data,
        );
        const base64 = part?.inlineData?.data;

        if (base64) {
          const pcm = Buffer.from(base64, "base64");
          const sampleRate = parsePcmRate(part.inlineData?.mimeType ?? "");
          const format = { sampleRate, channels: 1, bitsPerSample: 16 };
          return {
            data: pcmToWav(pcm, format),
            format: "wav",
            mimeType: "audio/wav",
            durationSeconds: Math.round(pcmDurationSeconds(pcm, format)),
            voiceName,
            provider: "gemini",
          };
        }
        lastError = `empty audio (finishReason: ${response.candidates?.[0]?.finishReason ?? "unknown"})`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }

    throw new Error(`Gemini TTS failed after ${maxAttempts} attempts: ${lastError}`);
  }
}
