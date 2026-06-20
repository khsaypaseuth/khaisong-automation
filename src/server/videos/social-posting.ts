import { prisma } from "@/lib/db";
import type { Platform } from "@prisma/client";
import { diskPathFromUrl } from "@/lib/storage";
import { getSettingsMap } from "@/server/settings/service";
import { FacebookPoster } from "@/providers/social/FacebookPoster";
import { TikTokPoster } from "@/providers/social/TikTokPoster";
import type { SocialPoster } from "@/providers/social/SocialPoster";

export type SocialConfig = {
  facebook: { pageId: string; accessToken: string; apiVersion?: string } | null;
  tiktok: { accessToken: string; privacyLevel?: string } | null;
};

/** Resolves posting config from the settings table, falling back to env. */
export async function resolveSocialConfig(): Promise<SocialConfig> {
  const settings = await getSettingsMap();

  const fbPageId = settings.facebook_page_id || process.env.FACEBOOK_PAGE_ID || "";
  const fbToken = settings.facebook_access_token || process.env.FACEBOOK_ACCESS_TOKEN || "";
  const ttToken = process.env.TIKTOK_ACCESS_TOKEN || "";

  return {
    facebook:
      fbPageId && fbToken
        ? {
            pageId: fbPageId,
            accessToken: fbToken,
            apiVersion: process.env.FACEBOOK_API_VERSION || "v21.0",
          }
        : null,
    tiktok: ttToken
      ? { accessToken: ttToken, privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL }
      : null,
  };
}

function buildPoster(platform: Platform, config: SocialConfig): SocialPoster {
  if (platform === "FACEBOOK") {
    if (!config.facebook) throw new Error("Facebook posting is not configured");
    return new FacebookPoster(config.facebook);
  }
  if (!config.tiktok) throw new Error("TikTok posting is not configured");
  return new TikTokPoster(config.tiktok);
}

/**
 * Posts an approved, rendered video to a platform via its API and records the
 * result in posting_logs.
 */
export async function postToSocial(
  videoPostId: string,
  platform: Platform,
): Promise<void> {
  const video = await prisma.videoPost.findUnique({ where: { id: videoPostId } });
  if (!video) throw new Error(`VideoPost ${videoPostId} not found`);
  if (video.approvalStatus !== "APPROVED") {
    throw new Error("Video must be approved before posting");
  }
  if (!video.videoUrl) throw new Error("Video has not been rendered");

  const config = await resolveSocialConfig();
  const poster = buildPoster(platform, config);

  const caption =
    platform === "FACEBOOK"
      ? (video.captionFacebook ?? "")
      : (video.captionTiktok ?? "");

  try {
    const result = await poster.post({
      videoPath: diskPathFromUrl(video.videoUrl),
      caption,
    });

    await prisma.$transaction([
      prisma.postingLog.create({
        data: {
          videoPostId,
          platform,
          platformPostId: result.platformPostId,
          status: "POSTED",
          postedAt: new Date(),
        },
      }),
      prisma.videoPost.update({
        where: { id: videoPostId },
        data: { status: "POSTED" },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.postingLog.create({
      data: {
        videoPostId,
        platform,
        status: "FAILED",
        errorMessage: message.slice(0, 5000),
      },
    });
    throw err;
  }
}
