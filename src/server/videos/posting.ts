import { prisma } from "@/lib/db";
import type { Platform } from "@prisma/client";

/**
 * Records a manual post for a platform (Phase 7 — the admin posts by hand and
 * marks it done). Idempotent per platform. Marks the video POSTED.
 */
export async function markManualPosted(
  videoPostId: string,
  platform: Platform,
  platformPostId?: string,
) {
  const existing = await prisma.postingLog.findFirst({
    where: { videoPostId, platform, status: "POSTED" },
  });

  if (!existing) {
    await prisma.postingLog.create({
      data: {
        videoPostId,
        platform,
        platformPostId: platformPostId ?? null,
        status: "POSTED",
        postedAt: new Date(),
      },
    });
  }

  await prisma.videoPost.update({
    where: { id: videoPostId },
    data: { status: "POSTED" },
  });

  return prisma.postingLog.findMany({ where: { videoPostId } });
}
