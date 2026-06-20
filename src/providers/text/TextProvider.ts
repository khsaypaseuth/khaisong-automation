// Phase 2 seam — script/caption generation (e.g. OpenAI GPT-5 Mini).
// Implementations live behind this interface so the provider stays swappable.

export type GeneratedScene = {
  sceneNumber: number;
  sceneTitle: string;
  sceneDescription: string;
  imagePrompt: string;
  overlayText: string;
  durationSeconds: number;
};

export type GeneratedVideoPlan = {
  title: string;
  hook: string;
  voiceScript: string;
  storyboard: GeneratedScene[];
  captionFacebook: string;
  captionTiktok: string;
  hashtags: string[];
  suggestedPostingDatetime: string;
};

export type CampaignGenerationInput = {
  goalPrompt: string;
  totalPosts: number;
  language: string;
  tone: string;
  targetAudience?: string | null;
};

export interface TextProvider {
  generateCampaignPlans(
    input: CampaignGenerationInput,
  ): Promise<{ campaignTitle: string; videos: GeneratedVideoPlan[] }>;
}

export class NotImplementedTextProvider implements TextProvider {
  async generateCampaignPlans(): Promise<never> {
    throw new Error("TextProvider not implemented (Phase 2)");
  }
}
