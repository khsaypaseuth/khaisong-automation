import { prisma } from "@/lib/db";
import { getTTSProvider } from "@/providers";
import { saveFile } from "@/lib/storage";

/**
 * Generates a voiceover for a video from its voice_script using the configured
 * TTS provider, saves the audio, and records a VoiceAsset.
 */
export async function generateVideoVoice(videoPostId: string): Promise<void> {
  const video = await prisma.videoPost.findUnique({
    where: { id: videoPostId },
    include: { campaign: { select: { language: true } } },
  });
  if (!video) throw new Error(`VideoPost ${videoPostId} not found`);

  const script = video.voiceScript?.trim();
  if (!script) throw new Error("No voice script to synthesize — generate scripts first");

  await prisma.videoPost.update({
    where: { id: videoPostId },
    data: { status: "GENERATING_VOICE" },
  });

  const provider = await getTTSProvider();

  try {
    const result = await provider.generateSpeech(script, {
      language: video.campaign.language,
    });

    const relPath = `campaigns/${video.campaignId}/${videoPostId}/audio/voice.${result.format}`;
    const url = await saveFile(relPath, result.data);

    await prisma.$transaction([
      prisma.voiceAsset.deleteMany({ where: { videoPostId } }),
      prisma.voiceAsset.create({
        data: {
          videoPostId,
          provider: result.provider,
          voiceName: result.voiceName,
          scriptText: script,
          audioUrl: url,
          durationSeconds: result.durationSeconds,
          status: "READY",
        },
      }),
      prisma.apiLog.create({
        data: {
          provider: result.provider,
          endpoint: `generateVideoVoice:${videoPostId}`,
          status: "success",
          responsePayload: {
            voiceName: result.voiceName,
            durationSeconds: result.durationSeconds,
          },
        },
      }),
      prisma.videoPost.update({
        where: { id: videoPostId },
        data: { status: "VOICE_GENERATED" },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.apiLog.create({
      data: {
        provider: "gemini",
        endpoint: `generateVideoVoice:${videoPostId}`,
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
