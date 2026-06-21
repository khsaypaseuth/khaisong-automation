import { prisma } from "@/lib/db";

// Ordered pipeline stages for the funnel display.
export const VIDEO_STAGES = [
  "DRAFT",
  "SCRIPT_GENERATED",
  "GENERATING_IMAGES",
  "IMAGES_GENERATED",
  "GENERATING_VOICE",
  "VOICE_GENERATED",
  "RENDERING",
  "VIDEO_RENDERED",
  "READY_FOR_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "POSTED",
  "FAILED",
] as const;

export async function getDashboardData() {
  const [
    totalCampaigns,
    totalVideos,
    pendingApprovals,
    approved,
    scheduled,
    failed,
    statusGroups,
    recentCampaigns,
    recentActivity,
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.videoPost.count(),
    prisma.videoPost.count({ where: { approvalStatus: "PENDING" } }),
    prisma.videoPost.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.videoPost.count({ where: { status: "SCHEDULED" } }),
    prisma.videoPost.count({ where: { status: "FAILED" } }),
    prisma.videoPost.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { videoPosts: true } } },
    }),
    prisma.apiLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const g of statusGroups) byStatus[g.status] = g._count._all;

  const pipeline = VIDEO_STAGES.map((stage) => ({
    stage,
    count: byStatus[stage] ?? 0,
  })).filter((s) => s.count > 0);

  return {
    stats: {
      totalCampaigns,
      totalVideos,
      pendingApprovals,
      approved,
      scheduled,
      failed,
    },
    pipeline,
    recentCampaigns,
    recentActivity,
  };
}
