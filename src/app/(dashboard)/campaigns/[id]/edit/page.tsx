import { notFound } from "next/navigation";
import { getCampaign } from "@/server/campaigns/service";
import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div>
      <PageHeader title="Edit campaign" description={campaign.title} />
      <CampaignForm
        campaignId={campaign.id}
        initial={{
          title: campaign.title,
          goalPrompt: campaign.goalPrompt,
          postsPerDay: campaign.postsPerDay,
          numberOfDays: campaign.numberOfDays,
          language: campaign.language,
          tone: campaign.tone,
          targetAudience: campaign.targetAudience ?? "",
          platforms: campaign.platforms,
        }}
      />
    </div>
  );
}
