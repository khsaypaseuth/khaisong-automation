import { GoogleGenAI } from "@google/genai";
import { generatedCampaignSchema } from "@/lib/validations/generation";
import type {
  CampaignGenerationInput,
  CampaignGenerationOutput,
  TextProvider,
} from "./TextProvider";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

export class GeminiTextProvider implements TextProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateCampaignPlans(
    input: CampaignGenerationInput,
  ): Promise<CampaignGenerationOutput> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildUserPrompt(input),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const rawResponse = response.text ?? "";
    if (!rawResponse) throw new Error("Gemini returned an empty response");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawResponse);
    } catch {
      throw new Error("Gemini response was not valid JSON");
    }

    const result = generatedCampaignSchema.parse(parsedJson);

    return {
      result,
      rawResponse,
      provider: "gemini",
      model: this.model,
    };
  }
}
