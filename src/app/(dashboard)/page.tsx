import Link from "next/link";
import { getDashboardData } from "@/server/dashboard/service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusVariant, titleCase } from "@/lib/labels";

export const dynamic = "force-dynamic";

const STAT_CARDS = [
  { key: "totalCampaigns", label: "Campaigns" },
  { key: "totalVideos", label: "Videos generated" },
  { key: "pendingApprovals", label: "Pending approvals" },
  { key: "approved", label: "Approved posts" },
  { key: "scheduled", label: "Scheduled posts" },
  { key: "failed", label: "Failed jobs" },
] as const;

function fmtDate(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const { stats, pipeline, recentCampaigns, recentActivity } =
    await getDashboardData();

  const maxStage = Math.max(1, ...pipeline.map((p) => p.count));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of campaigns and the content pipeline."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map((c) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No videos yet. Create a campaign and generate scripts.
              </p>
            ) : (
              <div className="space-y-2">
                {pipeline.map((p) => (
                  <div key={p.stage} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 text-xs text-muted-foreground">
                      {titleCase(p.stage)}
                    </div>
                    <div className="flex-1">
                      <div className="h-5 rounded bg-muted">
                        <div
                          className={`h-5 rounded ${
                            p.stage === "FAILED"
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                          style={{ width: `${(p.count / maxStage) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-8 shrink-0 text-right text-sm font-medium">
                      {p.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Link
              href="/logs"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentActivity.map((log) => (
                  <li key={log.id} className="flex items-center gap-2">
                    <Badge
                      variant={
                        log.status === "error" ? "destructive" : "secondary"
                      }
                    >
                      {log.status ?? "—"}
                    </Badge>
                    <span className="truncate text-muted-foreground">
                      {log.provider} · {log.endpoint}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent campaigns</CardTitle>
          <Link
            href="/campaigns"
            className="text-xs text-muted-foreground hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaigns yet.{" "}
              <Link href="/campaigns/new" className="underline">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y">
              {recentCampaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {c.title}
                  </Link>
                  <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                    <span>{c._count.videoPosts} videos</span>
                    <Badge variant={statusVariant(c.status)}>
                      {titleCase(c.status)}
                    </Badge>
                    <span className="hidden sm:inline">
                      {fmtDate(c.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
