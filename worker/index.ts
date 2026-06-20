// BullMQ worker entrypoint. Run with `pnpm worker` alongside Redis.
// Phase 2 registers the generate-scripts processor. Later phases add
// generate-images, generate-voice, render-video, post-to-social.

import { Worker, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../src/lib/queue";
import { generateCampaignScripts } from "../src/server/campaigns/generation";
import { generateVideoImages } from "../src/server/videos/image-generation";
import { generateVideoVoice } from "../src/server/videos/voice-generation";
import { renderVideo } from "../src/server/videos/render";
import type {
  GenerateScriptsJob,
  GenerateImagesJob,
  GenerateVoiceJob,
  RenderVideoJob,
} from "../src/server/jobs/dispatch";

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

  const imagesWorker = new Worker<GenerateImagesJob>(
    QUEUE_NAMES.generateImages,
    async (job) => {
      console.log(`[generate-images] video ${job.data.videoPostId}`);
      await generateVideoImages(job.data.videoPostId);
    },
    { connection: connection as unknown as ConnectionOptions, concurrency: 2 },
  );

  imagesWorker.on("completed", (job) =>
    console.log(`[generate-images] done ${job.id}`),
  );
  imagesWorker.on("failed", (job, err) =>
    console.error(`[generate-images] failed ${job?.id}:`, err.message),
  );

  const voiceWorker = new Worker<GenerateVoiceJob>(
    QUEUE_NAMES.generateVoice,
    async (job) => {
      console.log(`[generate-voice] video ${job.data.videoPostId}`);
      await generateVideoVoice(job.data.videoPostId);
    },
    { connection: connection as unknown as ConnectionOptions, concurrency: 2 },
  );

  voiceWorker.on("completed", (job) =>
    console.log(`[generate-voice] done ${job.id}`),
  );
  voiceWorker.on("failed", (job, err) =>
    console.error(`[generate-voice] failed ${job?.id}:`, err.message),
  );

  const renderWorker = new Worker<RenderVideoJob>(
    QUEUE_NAMES.renderVideo,
    async (job) => {
      console.log(`[render-video] video ${job.data.videoPostId}`);
      await renderVideo(job.data.videoPostId);
    },
    { connection: connection as unknown as ConnectionOptions, concurrency: 1 },
  );

  renderWorker.on("completed", (job) =>
    console.log(`[render-video] done ${job.id}`),
  );
  renderWorker.on("failed", (job, err) =>
    console.error(`[render-video] failed ${job?.id}:`, err.message),
  );

  console.log("Workers ready:", [
    QUEUE_NAMES.generateScripts,
    QUEUE_NAMES.generateImages,
    QUEUE_NAMES.generateVoice,
    QUEUE_NAMES.renderVideo,
  ]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
