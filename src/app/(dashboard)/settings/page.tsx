import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettingsMap } from "@/server/settings/service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettingsMap();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Provider keys and brand defaults. Phase 1 stores values; later phases consume them."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
