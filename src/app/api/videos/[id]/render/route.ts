import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchRenderVideo } from "@/server/jobs/dispatch";
import { ffmpegAvailable } from "@/providers/video/FFmpegVideoRenderer";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  if (!(await ffmpegAvailable())) {
    return NextResponse.json(
      { error: "FFmpeg is not installed or not on PATH (set FFMPEG_PATH)" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const video = await prisma.videoPost.findUnique({
    where: { id },
    include: {
      _count: { select: { scenes: true, voiceAssets: true } },
      scenes: { where: { imageUrl: { not: null } }, select: { id: true } },
    },
  });
  if (!video) return notFound("Video not found");

  if (video.scenes.length === 0) {
    return NextResponse.json(
      { error: "No scene images — generate images first" },
      { status: 409 },
    );
  }
  if (video._count.voiceAssets === 0) {
    return NextResponse.json(
      { error: "No voiceover — generate voice first" },
      { status: 409 },
    );
  }
  if (video.status === "RENDERING") {
    return NextResponse.json(
      { error: "Rendering already in progress" },
      { status: 409 },
    );
  }

  await dispatchRenderVideo(id);
  return NextResponse.json({ ok: true, status: "RENDERING" }, { status: 202 });
}
