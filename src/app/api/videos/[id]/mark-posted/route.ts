import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, badRequest, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { markManualPosted } from "@/server/videos/posting";

const schema = z.object({
  platform: z.enum(["FACEBOOK", "TIKTOK"]),
  platformPostId: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const video = await prisma.videoPost.findUnique({ where: { id } });
  if (!video) return notFound("Video not found");

  if (video.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Approve the video before marking it as posted" },
      { status: 409 },
    );
  }

  const logs = await markManualPosted(
    id,
    parsed.data.platform,
    parsed.data.platformPostId,
  );
  return NextResponse.json({ ok: true, postingLogs: logs });
}
