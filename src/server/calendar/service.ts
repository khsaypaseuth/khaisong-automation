import { prisma } from "@/lib/db";

export function listCalendarEntries() {
  return prisma.videoPost.findMany({
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      status: true,
      approvalStatus: true,
      scheduledDate: true,
      scheduledTime: true,
      targetPlatforms: true,
      videoUrl: true,
      captionFacebook: true,
      captionTiktok: true,
      campaign: { select: { id: true, title: true } },
    },
  });
}
