import { prisma } from "@/lib/db";
import type { Platform, Prisma } from "@prisma/client";
import type {
  VideoCreateInput,
  VideoUpdateInput,
} from "@/lib/validations/video";

export function listVideosByCampaign(campaignId: string) {
  return prisma.videoPost.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
  });
}

export function getVideo(id: string) {
  return prisma.videoPost.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, title: true, language: true } },
      scenes: { orderBy: { sceneNumber: "asc" } },
      voiceAssets: { orderBy: { createdAt: "desc" }, take: 1 },
      postingLogs: true,
    },
  });
}

export function createVideo(campaignId: string, input: VideoCreateInput) {
  return prisma.videoPost.create({
    data: {
      campaignId,
      title: input.title,
      hook: input.hook ?? null,
      targetPlatforms: input.targetPlatforms as Platform[],
      hashtags: input.hashtags,
    },
  });
}

export function updateVideo(id: string, input: VideoUpdateInput) {
  const data: Prisma.VideoPostUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.hook !== undefined) data.hook = input.hook ?? null;
  if (input.scriptText !== undefined) data.scriptText = input.scriptText ?? null;
  if (input.voiceScript !== undefined) data.voiceScript = input.voiceScript ?? null;
  if (input.captionFacebook !== undefined)
    data.captionFacebook = input.captionFacebook ?? null;
  if (input.captionTiktok !== undefined)
    data.captionTiktok = input.captionTiktok ?? null;
  if (input.hashtags !== undefined) data.hashtags = input.hashtags;
  if (input.targetPlatforms !== undefined)
    data.targetPlatforms = input.targetPlatforms as Platform[];
  if (input.scheduledDate !== undefined)
    data.scheduledDate = input.scheduledDate ?? null;
  if (input.scheduledTime !== undefined)
    data.scheduledTime = input.scheduledTime ?? null;

  return prisma.videoPost.update({ where: { id }, data });
}

export function deleteVideo(id: string) {
  return prisma.videoPost.delete({ where: { id } });
}
