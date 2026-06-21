import { generateVideoImages } from "./image-generation";
import { generateVideoVoice } from "./voice-generation";
import { renderVideo } from "./render";

/**
 * Runs the full asset pipeline for a single video sequentially:
 * images → voice → render. Each step manages its own status + logging and
 * throws on failure, halting the chain.
 */
export async function runVideoPipeline(videoPostId: string): Promise<void> {
  await generateVideoImages(videoPostId);
  await generateVideoVoice(videoPostId);
  await renderVideo(videoPostId);
}
