import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    totalCampaigns,
    totalVideos,
    pendingApprovals,
    approved,
    scheduled,
    failed,
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.videoPost.count(),
    prisma.videoPost.count({ where: { approvalStatus: "PENDING" } }),
    prisma.videoPost.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.videoPost.count({ where: { status: "SCHEDULED" } }),
    prisma.videoPost.count({ where: { status: "FAILED" } }),
  ]);
  return {
    totalCampaigns,
    totalVideos,
    pendingApprovals,
    approved,
    scheduled,
    failed,
  };
}

const CARDS: { key: keyof Awaited<ReturnType<typeof getStats>>; label: string }[] =
  [
    { key: "totalCampaigns", label: "Campaigns" },
    { key: "totalVideos", label: "Videos generated" },
    { key: "pendingApprovals", label: "Pending approvals" },
    { key: "approved", label: "Approved posts" },
    { key: "scheduled", label: "Scheduled posts" },
    { key: "failed", label: "Failed jobs" },
  ];

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of campaigns and video content."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Card key={c.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats[c.key]}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
