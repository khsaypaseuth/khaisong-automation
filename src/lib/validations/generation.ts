import { z } from "zod";

// Shape we expect GPT to return. Used to validate the model's JSON output.

export const generatedSceneSchema = z.object({
  sceneNumber: z.number().int().min(1),
  sceneTitle: z.string().default(""),
  sceneDescription: z.string().default(""),
  imagePrompt: z.string().default(""),
  overlayText: z.string().default(""),
  durationSeconds: z.number().int().min(1).max(20).default(5),
});

export const generatedVideoSchema = z.object({
  title: z.string().min(1),
  hook: z.string().default(""),
  voiceScript: z.string().default(""),
  storyboard: z.array(generatedSceneSchema).min(1),
  captionFacebook: z.string().default(""),
  captionTiktok: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  suggestedPostingDatetime: z.string().default(""),
});

export const generatedCampaignSchema = z.object({
  campaignTitle: z.string().default(""),
  videos: z.array(generatedVideoSchema).min(1),
});

export type GeneratedScene = z.infer<typeof generatedSceneSchema>;
export type GeneratedVideo = z.infer<typeof generatedVideoSchema>;
export type GeneratedCampaign = z.infer<typeof generatedCampaignSchema>;
