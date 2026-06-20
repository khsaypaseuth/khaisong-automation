// BullMQ worker entrypoint — scaffold only.
// Phase 1 registers no processors. From Phase 2 onward, register Workers here
// (generate-scripts, generate-images, generate-voice, render-video,
// post-to-social) against the queues defined in src/lib/queue.ts.

import { QUEUE_NAMES } from "../src/lib/queue";

async function main() {
  console.log("Khaisong worker starting…");
  console.log("Registered queues (no processors yet):", Object.values(QUEUE_NAMES));
  console.log("Phase 1: nothing to process. Add Workers in Phase 2+.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
