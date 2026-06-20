// Phase 3 seam — storyboard image generation (OpenAI images, Nano Banana,
// Magnific, etc.). Providers return raw bytes; the service persists them to
// storage so we stay independent of any provider's hosted-URL lifetime.

export type ImageGenerationOptions = {
  aspectRatio?: "9:16" | "1:1" | "16:9";
};

export type ImageGenerationResult = {
  data: Buffer;
  mimeType: string;
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
    throw new Error(
      "No image provider configured. Set IMAGE_PROVIDER / API keys to enable image generation (Phase 3).",
    );
  }
}
