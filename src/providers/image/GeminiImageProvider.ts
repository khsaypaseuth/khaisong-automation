import { GoogleGenAI } from "@google/genai";
import type {
  ImageGenerationOptions,
  ImageGenerationProvider,
  ImageGenerationResult,
} from "./ImageGenerationProvider";

/**
 * Gemini image generation (a.k.a. "Nano Banana", gemini-2.5-flash-image).
 * Returns inline image bytes. Aspect ratio is requested via the prompt text
 * since the API doesn't take explicit dimensions.
 */
export class GeminiImageProvider implements ImageGenerationProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    const ratio = options?.aspectRatio ?? "9:16";
    const fullPrompt = `${prompt}\n\nFull-bleed ${ratio} vertical portrait composition; keep the subject centered with headroom.`;

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: fullPrompt,
      config: {
        responseModalities: ["IMAGE"],
        // Native aspect-ratio control (Gemini image models).
        imageConfig: { aspectRatio: ratio },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    const data = imagePart?.inlineData?.data;
    if (!data) throw new Error("Gemini returned no image data");

    return {
      data: Buffer.from(data, "base64"),
      mimeType: imagePart?.inlineData?.mimeType ?? "image/png",
      width: 0,
      height: 0,
      provider: "gemini",
    };
  }
}
