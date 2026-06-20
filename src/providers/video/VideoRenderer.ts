// Phase 5 seam — FFmpeg rendering of images + voice + music into a 9:16 MP4.

export type RenderScene = {
  imageUrl: string;
  overlayText?: string;
  durationSeconds: number;
};

export type RenderInput = {
  scenes: RenderScene[];
  voiceAudioUrl: string;
  backgroundMusicUrl?: string;
  logoUrl?: string;
  outputPath: string;
};

export type RenderResult = {
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  resolution: string;
  fileSize: number;
};

export interface VideoRenderer {
  render(input: RenderInput): Promise<RenderResult>;
}

export class NotImplementedVideoRenderer implements VideoRenderer {
  async render(): Promise<never> {
    throw new Error("VideoRenderer not implemented (Phase 5)");
  }
}
