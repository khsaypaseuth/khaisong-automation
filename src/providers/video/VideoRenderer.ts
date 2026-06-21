// Phase 5 seam — FFmpeg rendering of images + voice + music into a 9:16 MP4.
// Inputs are absolute disk paths (the service resolves storage URLs first).

export type RenderScene = {
  imagePath: string;
  overlayText?: string | null;
  /** Optional pre-rendered transparent PNG (1080x1920) with the overlay text. */
  overlayImagePath?: string | null;
  durationSeconds: number;
};

export type RenderInput = {
  scenes: RenderScene[];
  voiceAudioPath: string;
  backgroundMusicPath?: string | null;
  logoPath?: string | null;
  /** Scale scene durations so the visuals span this many seconds (the
   * voiceover length), so every image is shown. */
  targetDurationSeconds?: number | null;
  outputVideoPath: string;
  outputThumbnailPath: string;
};

export type RenderResult = {
  durationSeconds: number;
  resolution: string;
  fileSize: number;
  /** The ffmpeg command line, persisted for debugging. */
  command: string;
};

export interface VideoRenderer {
  render(input: RenderInput): Promise<RenderResult>;
}

export class NotImplementedVideoRenderer implements VideoRenderer {
  async render(): Promise<never> {
    throw new Error("VideoRenderer not implemented (Phase 5)");
  }
}
