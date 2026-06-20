// Phase 4 seam — text-to-speech voice generation (Gemini TTS).
// Providers return raw audio bytes; the service persists them to storage.

export type TTSOptions = {
  language: string; // "Lao" | "Thai" | "Chinese" | "English" | ...
  voiceName?: string;
};

export type TTSResult = {
  data: Buffer;
  format: "wav" | "mp3";
  mimeType: string;
  durationSeconds: number;
  voiceName: string;
  provider: string;
};

export interface TTSProvider {
  generateSpeech(text: string, options: TTSOptions): Promise<TTSResult>;
}

export class NotImplementedTTSProvider implements TTSProvider {
  async generateSpeech(): Promise<never> {
    throw new Error(
      "No TTS provider configured. Set GEMINI_API_KEY to enable voice generation (Phase 4).",
    );
  }
}
