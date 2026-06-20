import { z } from "zod";
import { PLATFORMS } from "./campaign";

export const videoCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  hook: z.string().optional().nullable(),
  targetPlatforms: z.array(z.enum(PLATFORMS)).default([]),
  hashtags: z.array(z.string()).default([]),
});

export const videoUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  hook: z.string().optional().nullable(),
  scriptText: z.string().optional().nullable(),
  voiceScript: z.string().optional().nullable(),
  captionFacebook: z.string().optional().nullable(),
  captionTiktok: z.string().optional().nullable(),
  hashtags: z.array(z.string()).optional(),
  targetPlatforms: z.array(z.enum(PLATFORMS)).optional(),
  scheduledDate: z.coerce.date().optional().nullable(),
  scheduledTime: z.string().optional().nullable(),
});

export type VideoCreateInput = z.infer<typeof videoCreateSchema>;
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;
