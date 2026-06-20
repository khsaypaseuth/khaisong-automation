import OpenAI from "openai";
import type {
  ImageGenerationOptions,
  ImageGenerationProvider,
  ImageGenerationResult,
} from "./ImageGenerationProvider";

const SIZE_BY_RATIO: Record<string, { size: string; width: number; height: number }> = {
  "9:16": { size: "1024x1536", width: 1024, height: 1536 },
  "1:1": { size: "1024x1024", width: 1024, height: 1024 },
  "16:9": { size: "1536x1024", width: 1536, height: 1024 },
};

export class OpenAIImageProvider implements ImageGenerationProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    const ratio = options?.aspectRatio ?? "9:16";
    const dims = SIZE_BY_RATIO[ratio] ?? SIZE_BY_RATIO["9:16"];

    const res = await this.client.images.generate({
      model: this.model,
      prompt,
      size: dims.size as "1024x1536" | "1024x1024" | "1536x1024",
      n: 1,
    });

    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image provider returned no image data");

    return {
      data: Buffer.from(b64, "base64"),
      mimeType: "image/png",
      width: dims.width,
      height: dims.height,
      provider: "openai",
    };
  }
}
