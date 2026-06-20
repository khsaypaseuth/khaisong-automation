import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default function NewCampaignPage() {
  return (
    <div>
      <PageHeader
        title="New campaign"
        description="Define the goal prompt and schedule. Script generation comes in a later phase."
      />
      <CampaignForm />
    </div>
  );
}
