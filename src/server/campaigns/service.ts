import { prisma } from "@/lib/db";
import type { Platform, Prisma } from "@prisma/client";
import type {
  CampaignCreateInput,
  CampaignUpdateInput,
} from "@/lib/validations/campaign";

export function listCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videoPosts: true } } },
  });
}

export function getCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      videoPosts: { orderBy: { createdAt: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export function createCampaign(input: CampaignCreateInput, createdById?: string) {
  return prisma.campaign.create({
    data: {
      title: input.title,
      goalPrompt: input.goalPrompt,
      postsPerDay: input.postsPerDay,
      numberOfDays: input.numberOfDays,
      totalPosts: input.postsPerDay * input.numberOfDays,
      language: input.language,
      tone: input.tone,
      targetAudience: input.targetAudience ?? null,
      platforms: input.platforms as Platform[],
      createdById: createdById ?? null,
    },
  });
}

export async function updateCampaign(id: string, input: CampaignUpdateInput) {
  const data: Prisma.CampaignUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.goalPrompt !== undefined) data.goalPrompt = input.goalPrompt;
  if (input.language !== undefined) data.language = input.language;
  if (input.tone !== undefined) data.tone = input.tone;
  if (input.targetAudience !== undefined)
    data.targetAudience = input.targetAudience ?? null;
  if (input.platforms !== undefined)
    data.platforms = input.platforms as Platform[];

  // Recompute totalPosts when either factor changes.
  if (input.postsPerDay !== undefined || input.numberOfDays !== undefined) {
    const current = await prisma.campaign.findUnique({ where: { id } });
    if (!current) return null;
    const postsPerDay = input.postsPerDay ?? current.postsPerDay;
    const numberOfDays = input.numberOfDays ?? current.numberOfDays;
    data.postsPerDay = postsPerDay;
    data.numberOfDays = numberOfDays;
    data.totalPosts = postsPerDay * numberOfDays;
  }

  return prisma.campaign.update({ where: { id }, data });
}

export function deleteCampaign(id: string) {
  return prisma.campaign.delete({ where: { id } });
}
