import { prisma } from "@/lib/db";
import { getImageProvider } from "@/providers";
import { saveFile } from "@/lib/storage";

// Brand-consistent style appended to every scene prompt. No text in images —
// overlay text is added later by FFmpeg (Phase 5).
const STYLE_SUFFIX =
  "Vertical 9:16 social media image, realistic logistics business style, Southeast Asia, " +
  "China-Laos freight forwarding, professional warehouse, delivery truck, friendly staff, " +
  "clean modern look, no text, no watermark, no logo, high detail.";

function buildPrompt(scenePrompt: string): string {
  return `${scenePrompt.trim()}\n\n${STYLE_SUFFIX}`;
}

/**
 * Generates one image per storyboard scene that has an image prompt, saves it
 * to local storage, and records the URL on the scene.
 */
export async function generateVideoImages(videoPostId: string): Promise<void> {
  const video = await prisma.videoPost.findUnique({
    where: { id: videoPostId },
    include: { scenes: { orderBy: { sceneNumber: "asc" } } },
  });
  if (!video) throw new Error(`VideoPost ${videoPostId} not found`);

  const scenes = video.scenes.filter((s) => s.imagePrompt?.trim());
  if (scenes.length === 0) {
    throw new Error("No storyboard scenes with image prompts to generate");
  }

  await prisma.videoPost.update({
    where: { id: videoPostId },
    data: { status: "GENERATING_IMAGES" },
  });

  const provider = getImageProvider();

  try {
    for (const scene of scenes) {
      const result = await provider.generateImage(buildPrompt(scene.imagePrompt!), {
        aspectRatio: "9:16",
      });

      const ext = result.mimeType === "image/png" ? "png" : "jpg";
      const relPath = `campaigns/${video.campaignId}/${videoPostId}/images/scene-${scene.sceneNumber}.${ext}`;
      const url = await saveFile(relPath, result.data);

      await prisma.storyboardScene.update({
        where: { id: scene.id },
        data: { imageUrl: url },
      });
    }

    await prisma.apiLog.create({
      data: {
        provider: "image",
        endpoint: `generateVideoImages:${videoPostId}`,
        status: "success",
        responsePayload: { sceneCount: scenes.length },
      },
    });

    await prisma.videoPost.update({
      where: { id: videoPostId },
      data: { status: "IMAGES_GENERATED" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.apiLog.create({
      data: {
        provider: "image",
        endpoint: `generateVideoImages:${videoPostId}`,
        status: "error",
        errorMessage: message,
      },
    });
    await prisma.videoPost.update({
      where: { id: videoPostId },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
