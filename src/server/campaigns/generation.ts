import { prisma } from "@/lib/db";
import { getTextProvider } from "@/providers";
import type { Platform } from "@prisma/client";
import type { GeneratedVideo } from "@/lib/validations/generation";

function parseSuggestedDatetime(value: string): {
  date: Date | null;
  time: string | null;
} {
  if (!value) return { date: null, time: null };
  // Expected "YYYY-MM-DD HH:mm" (or ISO). Be lenient.
  const match = value.match(/(\d{4}-\d{2}-\d{2})[ T]?(\d{2}:\d{2})?/);
  if (!match) return { date: null, time: null };
  const date = new Date(`${match[1]}T${match[2] ?? "00:00"}:00`);
  return {
    date: Number.isNaN(date.getTime()) ? null : date,
    time: match[2] ?? null,
  };
}

function toVideoData(video: GeneratedVideo, targetPlatforms: Platform[]) {
  const { date, time } = parseSuggestedDatetime(video.suggestedPostingDatetime);
  return {
    title: video.title,
    hook: video.hook || null,
    voiceScript: video.voiceScript || null,
    scriptText: video.voiceScript || null,
    captionFacebook: video.captionFacebook || null,
    captionTiktok: video.captionTiktok || null,
    hashtags: video.hashtags,
    targetPlatforms,
    scheduledDate: date,
    scheduledTime: time,
    status: "SCRIPT_GENERATED" as const,
    scenes: {
      create: video.storyboard.map((scene, idx) => ({
        sceneNumber: scene.sceneNumber || idx + 1,
        sceneTitle: scene.sceneTitle || null,
        sceneDescription: scene.sceneDescription || null,
        imagePrompt: scene.imagePrompt || null,
        overlayText: scene.overlayText || null,
        durationSeconds: scene.durationSeconds || 5,
      })),
    },
  };
}

/**
 * Generates scripts + storyboards for a campaign via the configured text
 * provider and persists them. Idempotent-ish: replaces any prior generated
 * video posts for the campaign so re-running produces a clean set.
 */
export async function generateCampaignScripts(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "GENERATING_SCRIPTS" },
  });

  const provider = await getTextProvider();

  try {
    const output = await provider.generateCampaignPlans({
      goalPrompt: campaign.goalPrompt,
      totalPosts: campaign.totalPosts,
      language: campaign.language,
      tone: campaign.tone,
      targetAudience: campaign.targetAudience,
    });

    await prisma.apiLog.create({
      data: {
        provider: output.provider,
        endpoint: `chat.completions:${output.model}`,
        responsePayload: output.rawResponse.slice(0, 100_000),
        status: "success",
      },
    });

    const targetPlatforms = campaign.platforms;

    await prisma.$transaction(async (tx) => {
      // Clear previously generated posts so re-generation is clean.
      await tx.videoPost.deleteMany({ where: { campaignId } });

      for (const video of output.result.videos) {
        await tx.videoPost.create({
          data: { campaignId, ...toVideoData(video, targetPlatforms) },
        });
      }

      await tx.campaign.update({
        where: { id: campaignId },
        data: { status: "SCRIPTS_GENERATED" },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.apiLog.create({
      data: {
        provider: "openai",
        endpoint: "generateCampaignScripts",
        status: "error",
        errorMessage: message,
      },
    });
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
