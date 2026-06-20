import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchPostToSocial } from "@/server/jobs/dispatch";
import { resolveSocialConfig } from "@/server/videos/social-posting";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const config = await resolveSocialConfig();
  if (!config.tiktok) {
    return NextResponse.json(
      { error: "TikTok posting is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const video = await prisma.videoPost.findUnique({ where: { id } });
  if (!video) return notFound("Video not found");

  if (video.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Video is not approved" }, { status: 409 });
  }
  if (!video.videoUrl) {
    return NextResponse.json({ error: "Video is not rendered" }, { status: 409 });
  }

  await dispatchPostToSocial(id, "TIKTOK");
  return NextResponse.json({ ok: true, platform: "TIKTOK" }, { status: 202 });
}
