import { notFound } from "next/navigation";
import { getCampaign } from "@/server/campaigns/service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { GenerateScriptsButton } from "@/components/campaigns/generate-scripts-button";
import { VideoManager } from "@/components/videos/video-manager";
import { statusVariant, titleCase, PLATFORM_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={campaign.title}
        description={`${campaign.language} · ${campaign.postsPerDay} posts/day × ${campaign.numberOfDays} days = ${campaign.totalPosts} posts`}
        action={<CampaignActions campaignId={campaign.id} />}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(campaign.status)}>
              {titleCase(campaign.status)}
            </Badge>
            {campaign.platforms.map((p) => (
              <Badge key={p} variant="outline">
                {PLATFORM_LABELS[p] ?? p}
              </Badge>
            ))}
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Goal prompt
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {campaign.goalPrompt}
            </p>
          </div>
          {campaign.targetAudience && (
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Target audience
              </div>
              <p className="mt-1 text-sm">{campaign.targetAudience}</p>
            </div>
          )}
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Tone
            </div>
            <p className="mt-1 text-sm">{campaign.tone}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Video posts</h2>
          <GenerateScriptsButton
            campaignId={campaign.id}
            status={campaign.status}
          />
        </div>
        {campaign.status === "GENERATING_SCRIPTS" && (
          <div className="mb-4 rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Generating scripts and storyboards… this can take up to a minute.
          </div>
        )}
        <VideoManager
          campaignId={campaign.id}
          videos={campaign.videoPosts.map((v) => ({
            id: v.id,
            title: v.title,
            hook: v.hook,
            status: v.status,
            approvalStatus: v.approvalStatus,
          }))}
        />
      </section>
    </div>
  );
}
