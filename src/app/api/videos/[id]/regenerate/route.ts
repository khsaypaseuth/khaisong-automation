import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  dispatchVideoPipeline,
  dispatchGenerateImages,
  dispatchGenerateVoice,
  dispatchRenderVideo,
} from "@/server/jobs/dispatch";

type Params = { params: Promise<{ id: string }> };

// Re-runs assets for a single video. body.target: "all" (default) | "images" |
// "voice" | "render".
export async function POST(req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const video = await prisma.videoPost.findUnique({
    where: { id },
    include: { _count: { select: { scenes: true } } },
  });
  if (!video) return notFound("Video not found");

  if (video._count.scenes === 0) {
    return NextResponse.json(
      { error: "Generate scripts first — no storyboard scenes" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const target = (body?.target as string) || "all";

  switch (target) {
    case "images":
      await dispatchGenerateImages(id);
      break;
    case "voice":
      await dispatchGenerateVoice(id);
      break;
    case "render":
      await dispatchRenderVideo(id);
      break;
    default:
      await dispatchVideoPipeline(id);
  }

  return NextResponse.json({ ok: true, target }, { status: 202 });
}
