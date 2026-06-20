// BullMQ scaffold. Defined in Phase 1, used from Phase 2 onward.
// No connection is opened at import time — call getRedisConnection() lazily
// inside producers/workers so the web app doesn't require Redis just to boot.

import { Queue, type ConnectionOptions } from "bullmq";
import IORedis, { type Redis } from "ioredis";

export const QUEUE_NAMES = {
  generateScripts: "generate-scripts",
  generateImages: "generate-images",
  generateVoice: "generate-voice",
  renderVideo: "render-video",
  postToSocial: "post-to-social",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

let connection: Redis | undefined;

export function getRedisConnection(): Redis {
  if (!connection) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: getRedisConnection() as unknown as ConnectionOptions,
    });
    queues.set(name, queue);
  }
  return queue;
}
