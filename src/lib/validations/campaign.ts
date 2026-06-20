import { z } from "zod";

export const PLATFORMS = ["FACEBOOK", "TIKTOK"] as const;

export const campaignCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  goalPrompt: z.string().min(1, "Goal prompt is required"),
  postsPerDay: z.coerce.number().int().min(1).max(20),
  numberOfDays: z.coerce.number().int().min(1).max(60),
  language: z.string().min(1).default("Lao"),
  tone: z.string().min(1).default("Helpful, trustworthy, professional"),
  targetAudience: z.string().optional().nullable(),
  platforms: z.array(z.enum(PLATFORMS)).min(1, "Select at least one platform"),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
