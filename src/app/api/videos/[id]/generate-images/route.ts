import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchGenerateImages } from "@/server/jobs/dispatch";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const hasKey = process.env.IMAGE_PROVIDER_API_KEY || process.env.OPENAI_API_KEY;
  if (!hasKey) {
    return NextResponse.json(
      { error: "No image provider key configured" },
      { status: 503 },
    );
  }

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
  if (video.status === "GENERATING_IMAGES") {
    return NextResponse.json(
      { error: "Image generation already in progress" },
      { status: 409 },
    );
  }

  await dispatchGenerateImages(id);
  return NextResponse.json(
    { ok: true, status: "GENERATING_IMAGES" },
    { status: 202 },
  );
}
