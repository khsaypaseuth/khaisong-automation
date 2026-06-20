import { QUEUE_NAMES, getQueue } from "@/lib/queue";
import { generateCampaignScripts } from "@/server/campaigns/generation";
import { generateVideoImages } from "@/server/videos/image-generation";
import { generateVideoVoice } from "@/server/videos/voice-generation";
import { renderVideo } from "@/server/videos/render";

export type GenerateScriptsJob = { campaignId: string };
export type GenerateImagesJob = { videoPostId: string };
export type GenerateVoiceJob = { videoPostId: string };
export type RenderVideoJob = { videoPostId: string };

/**
 * Runs jobs inline (in-process) when INLINE_JOBS=true or no REDIS_URL is set —
 * convenient for local dev without a separate worker. Otherwise enqueues to
 * BullMQ for the worker process to handle.
 */
function runInline(): boolean {
  return process.env.INLINE_JOBS === "true" || !process.env.REDIS_URL;
}

export async function dispatchGenerateScripts(campaignId: string): Promise<void> {
  if (runInline()) {
    // Fire-and-forget: the route returns immediately while generation runs.
    void generateCampaignScripts(campaignId).catch((err) => {
      console.error(`[inline] generateCampaignScripts failed: ${campaignId}`, err);
    });
    return;
  }

  await getQueue(QUEUE_NAMES.generateScripts).add(
    "generate",
    { campaignId } satisfies GenerateScriptsJob,
    { attempts: 2, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100 },
  );
}

export async function dispatchGenerateImages(videoPostId: string): Promise<void> {
  if (runInline()) {
    void generateVideoImages(videoPostId).catch((err) => {
      console.error(`[inline] generateVideoImages failed: ${videoPostId}`, err);
    });
    return;
  }

  await getQueue(QUEUE_NAMES.generateImages).add(
    "generate",
    { videoPostId } satisfies GenerateImagesJob,
    { attempts: 2, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100 },
  );
}

export async function dispatchGenerateVoice(videoPostId: string): Promise<void> {
  if (runInline()) {
    void generateVideoVoice(videoPostId).catch((err) => {
      console.error(`[inline] generateVideoVoice failed: ${videoPostId}`, err);
    });
    return;
  }

  await getQueue(QUEUE_NAMES.generateVoice).add(
    "generate",
    { videoPostId } satisfies GenerateVoiceJob,
    { attempts: 2, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100 },
  );
}

export async function dispatchRenderVideo(videoPostId: string): Promise<void> {
  if (runInline()) {
    void renderVideo(videoPostId).catch((err) => {
      console.error(`[inline] renderVideo failed: ${videoPostId}`, err);
    });
    return;
  }

  await getQueue(QUEUE_NAMES.renderVideo).add(
    "render",
    { videoPostId } satisfies RenderVideoJob,
    { attempts: 1, removeOnComplete: 50 },
  );
}
