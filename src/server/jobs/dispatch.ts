import { QUEUE_NAMES, getQueue } from "@/lib/queue";
import { generateCampaignScripts } from "@/server/campaigns/generation";

export type GenerateScriptsJob = { campaignId: string };

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
