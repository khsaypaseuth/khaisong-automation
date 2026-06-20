import { promises as fs } from "node:fs";
import { prisma } from "@/lib/db";
import { getVideoRenderer } from "@/providers";
import {
  diskPathFromUrl,
  resolveStoragePath,
  fileUrl,
} from "@/lib/storage";

async function existingPath(p?: string | null): Promise<string | null> {
  if (!p) return null;
  try {
    await fs.access(p);
    return p;
  } catch {
    return null;
  }
}

/**
 * Renders the final 9:16 MP4 reel for a video from its scene images and
 * voiceover via FFmpeg, then records a VideoAsset and marks it ready for review.
 */
export async function renderVideo(videoPostId: string): Promise<void> {
  const video = await prisma.videoPost.findUnique({
    where: { id: videoPostId },
    include: {
      scenes: { orderBy: { sceneNumber: "asc" } },
      voiceAssets: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!video) throw new Error(`VideoPost ${videoPostId} not found`);

  const scenes = video.scenes.filter((s) => s.imageUrl);
  if (scenes.length === 0) {
    throw new Error("No scene images — generate images first");
  }
  const voice = video.voiceAssets[0];
  if (!voice?.audioUrl) {
    throw new Error("No voiceover — generate voice first");
  }

  await prisma.videoPost.update({
    where: { id: videoPostId },
    data: { status: "RENDERING" },
  });

  const renderer = getVideoRenderer();

  const outputVideoRel = `campaigns/${video.campaignId}/${videoPostId}/video/reel.mp4`;
  const outputThumbRel = `campaigns/${video.campaignId}/${videoPostId}/thumbnail/thumb.jpg`;

  try {
    const musicPath = await existingPath(process.env.DEFAULT_BACKGROUND_MUSIC_PATH);
    const logoPath = await existingPath(process.env.DEFAULT_LOGO_PATH);

    const result = await renderer.render({
      scenes: scenes.map((s) => ({
        imagePath: diskPathFromUrl(s.imageUrl!),
        overlayText: s.overlayText,
        durationSeconds: s.durationSeconds,
      })),
      voiceAudioPath: diskPathFromUrl(voice.audioUrl),
      backgroundMusicPath: musicPath,
      logoPath,
      outputVideoPath: resolveStoragePath(outputVideoRel),
      outputThumbnailPath: resolveStoragePath(outputThumbRel),
    });

    const videoUrl = fileUrl(outputVideoRel);
    const thumbnailUrl = fileUrl(outputThumbRel);

    await prisma.$transaction([
      prisma.videoAsset.deleteMany({ where: { videoPostId } }),
      prisma.videoAsset.create({
        data: {
          videoPostId,
          videoUrl,
          format: "mp4",
          resolution: result.resolution,
          durationSeconds: result.durationSeconds,
          fileSize: result.fileSize,
          status: "READY",
        },
      }),
      prisma.apiLog.create({
        data: {
          provider: "ffmpeg",
          endpoint: `renderVideo:${videoPostId}`,
          status: "success",
          requestPayload: { command: result.command.slice(0, 50_000) },
          responsePayload: {
            resolution: result.resolution,
            fileSize: result.fileSize,
          },
        },
      }),
      prisma.videoPost.update({
        where: { id: videoPostId },
        data: { videoUrl, thumbnailUrl, status: "READY_FOR_REVIEW" },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.apiLog.create({
      data: {
        provider: "ffmpeg",
        endpoint: `renderVideo:${videoPostId}`,
        status: "error",
        errorMessage: message.slice(0, 10_000),
      },
    });
    await prisma.videoPost.update({
      where: { id: videoPostId },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
