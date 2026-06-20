// Phase 2 seam — script/caption/storyboard generation (e.g. OpenAI GPT-5 Mini).
// Implementations live behind this interface so the provider stays swappable.

import type { GeneratedCampaign } from "@/lib/validations/generation";

export type CampaignGenerationInput = {
  goalPrompt: string;
  totalPosts: number;
  language: string;
  tone: string;
  targetAudience?: string | null;
};

export type CampaignGenerationOutput = {
  result: GeneratedCampaign;
  /** Raw model text, persisted to api_logs for debugging. */
  rawResponse: string;
  provider: string;
  model: string;
};

export interface TextProvider {
  generateCampaignPlans(
    input: CampaignGenerationInput,
  ): Promise<CampaignGenerationOutput>;
}

export class NotImplementedTextProvider implements TextProvider {
  async generateCampaignPlans(): Promise<never> {
    throw new Error(
      "No text provider configured. Set OPENAI_API_KEY to enable script generation (Phase 2).",
    );
  }
}
