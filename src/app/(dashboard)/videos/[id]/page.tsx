import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideo } from "@/server/videos/service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateImagesButton } from "@/components/videos/generate-images-button";
import { GenerateVoiceButton } from "@/components/videos/generate-voice-button";
import { RenderVideoButton } from "@/components/videos/render-video-button";
import { ReviewPanel } from "@/components/videos/review-panel";
import { PostingPanel } from "@/components/videos/posting-panel";
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

      <ReviewPanel
        videoId={video.id}
        approvalStatus={video.approvalStatus}
        hasVideo={Boolean(video.videoUrl)}
        initial={{
          captionFacebook: video.captionFacebook ?? "",
          captionTiktok: video.captionTiktok ?? "",
          hashtags: video.hashtags.join(" "),
          scheduledDate: video.scheduledDate
            ? new Date(video.scheduledDate).toISOString().slice(0, 10)
            : "",
          scheduledTime: video.scheduledTime ?? "",
        }}
      />

      <PostingPanel
        videoId={video.id}
        approved={video.approvalStatus === "APPROVED"}
        videoUrl={video.videoUrl}
        platforms={video.targetPlatforms}
        captions={{
          FACEBOOK: video.captionFacebook ?? "",
          TIKTOK: video.captionTiktok ?? "",
        }}
        postedPlatforms={video.postingLogs
          .filter((l) => l.status === "POSTED")
          .map((l) => l.platform)}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Final video</h2>
          <RenderVideoButton
            videoId={video.id}
            status={video.status}
            ready={
              video.scenes.some((s) => s.imageUrl) &&
              video.voiceAssets.length > 0
            }
            hasVideo={Boolean(video.videoUrl)}
          />
        </div>
        {video.status === "RENDERING" && (
          <div className="mb-3 rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Rendering the MP4 reel… this can take a couple of minutes.
          </div>
        )}
        {video.videoUrl ? (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <video
                controls
                src={video.videoUrl}
                poster={video.thumbnailUrl ?? undefined}
                className="mx-auto aspect-[9/16] max-h-[70vh] rounded-md bg-black"
              />
              <Button variant="outline" size="sm" render={<a href={video.videoUrl} download />}>
                Download MP4
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No rendered video yet. Generate images and voice first, then render.
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Voiceover</h2>
          <GenerateVoiceButton
            videoId={video.id}
            status={video.status}
            hasScript={Boolean(video.voiceScript?.trim())}
            hasVoice={video.voiceAssets.length > 0}
          />
        </div>
        {video.status === "GENERATING_VOICE" && (
          <div className="mb-3 rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Generating voiceover… this usually takes a few seconds.
          </div>
        )}
        {video.voiceAssets[0]?.audioUrl ? (
          <Card>
            <CardContent className="space-y-2 pt-6">
              <audio controls src={video.voiceAssets[0].audioUrl} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Voice: {video.voiceAssets[0].voiceName ?? "—"}
                {video.voiceAssets[0].durationSeconds
                  ? ` · ${video.voiceAssets[0].durationSeconds}s`
                  : ""}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No voiceover yet.
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Storyboard</h2>
          {video.scenes.length > 0 && (
            <GenerateImagesButton
              videoId={video.id}
              status={video.status}
              hasScenes={video.scenes.length > 0}
            />
          )}
        </div>
        {video.status === "GENERATING_IMAGES" && (
          <div className="mb-3 rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Generating images for each scene… this can take a minute or two.
          </div>
        )}
        {video.scenes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No storyboard scenes yet. Generate scripts on the campaign first.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {video.scenes.map((s) => (
              <Card key={s.id} className="overflow-hidden pt-0">
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt={`Scene ${s.sceneNumber}`}
                    className="aspect-[9/16] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[9/16] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <CardContent className="space-y-1 pb-4 text-sm">
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
