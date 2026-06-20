import OpenAI from "openai";
import { generatedCampaignSchema } from "@/lib/validations/generation";
import type {
  CampaignGenerationInput,
  CampaignGenerationOutput,
  TextProvider,
} from "./TextProvider";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

export class OpenAITextProvider implements TextProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateCampaignPlans(
    input: CampaignGenerationInput,
  ): Promise<CampaignGenerationOutput> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content ?? "";
    if (!rawResponse) {
      throw new Error("OpenAI returned an empty response");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawResponse);
    } catch {
      throw new Error("OpenAI response was not valid JSON");
    }

    const result = generatedCampaignSchema.parse(parsedJson);

    return {
      result,
      rawResponse,
      provider: "openai",
      model: this.model,
    };
  }
}
