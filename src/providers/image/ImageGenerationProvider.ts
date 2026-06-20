// Phase 3 seam — storyboard image generation (Nano Banana / Magnific / etc.).

export type ImageGenerationOptions = {
  aspectRatio?: "9:16" | "1:1" | "16:9";
  width?: number;
  height?: number;
};

export type ImageGenerationResult = {
  url: string;
  width: number;
  height: number;
  provider: string;
};

export interface ImageGenerationProvider {
  generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult>;
}

export class NotImplementedImageProvider implements ImageGenerationProvider {
  async generateImage(): Promise<never> {
    throw new Error("ImageGenerationProvider not implemented (Phase 3)");
  }
}
