import { prisma } from "@/lib/db";
import { resolveSocialConfig } from "@/server/videos/social-posting";
import { dispatchPostToSocial } from "./dispatch";

function isDue(
  date: Date | null,
  time: string | null,
  now: Date,
): boolean {
  if (!date) return false;
  const due = new Date(date);
  if (time) {
    const [h, m] = time.split(":").map(Number);
    if (!Number.isNaN(h)) due.setHours(h, m || 0, 0, 0);
  }
  return due.getTime() <= now.getTime();
}

/**
 * Finds approved videos whose scheduled time has arrived and dispatches API
 * posting for each target platform not yet attempted. Returns how many posts
 * were dispatched. Safe to run repeatedly — it skips platforms with an
 * existing posting log.
 */
export async function runScheduledPosting(now = new Date()): Promise<number> {
  const config = await resolveSocialConfig();
  if (!config.facebook && !config.tiktok) return 0;

  const candidates = await prisma.videoPost.findMany({
    where: {
      approvalStatus: "APPROVED",
      videoUrl: { not: null },
      scheduledDate: { not: null, lte: now },
    },
    include: { postingLogs: true },
  });

  let dispatched = 0;
  for (const video of candidates) {
    if (!isDue(video.scheduledDate, video.scheduledTime, now)) continue;
    for (const platform of video.targetPlatforms) {
      if (platform === "FACEBOOK" && !config.facebook) continue;
      if (platform === "TIKTOK" && !config.tiktok) continue;
      if (video.postingLogs.some((l) => l.platform === platform)) continue;
      await dispatchPostToSocial(video.id, platform);
      dispatched++;
    }
  }
  return dispatched;
}
