import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { approveVideo } from "@/server/videos/approval";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const video = await prisma.videoPost.findUnique({ where: { id } });
  if (!video) return notFound("Video not found");

  if (!video.videoUrl) {
    return NextResponse.json(
      { error: "Render the video before approving" },
      { status: 409 },
    );
  }

  const updated = await approveVideo(id);
  return NextResponse.json(updated);
}
