import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { rejectVideo } from "@/server/videos/approval";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const video = await prisma.videoPost.findUnique({ where: { id } });
  if (!video) return notFound("Video not found");

  const updated = await rejectVideo(id);
  return NextResponse.json(updated);
}
