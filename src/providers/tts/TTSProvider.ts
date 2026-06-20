// Phase 4 seam — text-to-speech voice generation (Gemini TTS).

export type TTSOptions = {
  language: "Lao" | "Thai" | "Chinese" | "English" | string;
  voiceName?: string;
  format?: "mp3" | "wav";
};

export type TTSResult = {
  url: string;
  durationSeconds: number;
  voiceName: string;
  provider: string;
};

export interface TTSProvider {
  generateSpeech(text: string, options: TTSOptions): Promise<TTSResult>;
}

export class NotImplementedTTSProvider implements TTSProvider {
  async generateSpeech(): Promise<never> {
    throw new Error("TTSProvider not implemented (Phase 4)");
  }
}
