import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideo } from "@/server/videos/service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { statusVariant, titleCase, PLATFORM_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={video.title}
        description={`Campaign: ${video.campaign.title}`}
        action={
          <Button
            variant="outline"
            render={<Link href={`/campaigns/${video.campaign.id}`} />}
          >
            Back to campaign
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(video.status)}>
              {titleCase(video.status)}
            </Badge>
            <Badge variant={statusVariant(video.approvalStatus)}>
              {titleCase(video.approvalStatus)}
            </Badge>
            {video.targetPlatforms.map((p) => (
              <Badge key={p} variant="outline">
                {PLATFORM_LABELS[p] ?? p}
              </Badge>
            ))}
          </div>

          <Field label="Hook" value={video.hook} />
          <Field label="Voice script" value={video.voiceScript} multiline />
          <Field label="Facebook caption" value={video.captionFacebook} multiline />
          <Field label="TikTok caption" value={video.captionTiktok} multiline />
          {video.hashtags.length > 0 && (
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Hashtags
              </div>
              <p className="mt-1 text-sm">{video.hashtags.join(" ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Storyboard</h2>
        {video.scenes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No storyboard scenes yet. Scenes, images, and voice are generated in
            later phases.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {video.scenes.map((s) => (
              <Card key={s.id}>
                <CardContent className="space-y-1 pt-6 text-sm">
                  <div className="font-medium">
                    Scene {s.sceneNumber}
                    {s.sceneTitle ? ` · ${s.sceneTitle}` : ""}
                  </div>
                  {s.sceneDescription && (
                    <p className="text-muted-foreground">{s.sceneDescription}</p>
                  )}
                  {s.overlayText && (
                    <p className="text-xs">Overlay: {s.overlayText}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <p
        className={`mt-1 text-sm ${multiline ? "whitespace-pre-wrap" : ""} ${
          value ? "" : "italic text-muted-foreground"
        }`}
      >
        {value || "Not generated yet"}
      </p>
    </div>
  );
}
