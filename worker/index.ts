// BullMQ worker entrypoint. Run with `pnpm worker` alongside Redis.
// Phase 2 registers the generate-scripts processor. Later phases add
// generate-images, generate-voice, render-video, post-to-social.

import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../src/lib/queue";
import { generateCampaignScripts } from "../src/server/campaigns/generation";
import type { GenerateScriptsJob } from "../src/server/jobs/dispatch";

async function main() {
  const connection = getRedisConnection();
  console.log("Khaisong worker starting…");

  const scriptsWorker = new Worker<GenerateScriptsJob>(
    QUEUE_NAMES.generateScripts,
    async (job) => {
      console.log(`[generate-scripts] campaign ${job.data.campaignId}`);
      await generateCampaignScripts(job.data.campaignId);
    },
    { connection: connection as unknown as ConnectionOptions, concurrency: 2 },
  );

  scriptsWorker.on("completed", (job) =>
    console.log(`[generate-scripts] done ${job.id}`),
  );
  scriptsWorker.on("failed", (job, err) =>
    console.error(`[generate-scripts] failed ${job?.id}:`, err.message),
  );

  console.log("Workers ready:", [QUEUE_NAMES.generateScripts]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
