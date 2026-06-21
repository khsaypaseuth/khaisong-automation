import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchGenerateVoice } from "@/server/jobs/dispatch";
import { resolveKeys } from "@/server/settings/keys";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { geminiKey } = await resolveKeys();
  if (!geminiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured (Settings or env)" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const video = await prisma.videoPost.findUnique({ where: { id } });
  if (!video) return notFound("Video not found");

  if (!video.voiceScript?.trim()) {
    return NextResponse.json(
      { error: "No voice script — generate scripts first" },
      { status: 409 },
    );
  }
  if (video.status === "GENERATING_VOICE") {
    return NextResponse.json(
      { error: "Voice generation already in progress" },
      { status: 409 },
    );
  }

  await dispatchGenerateVoice(id);
  return NextResponse.json(
    { ok: true, status: "GENERATING_VOICE" },
    { status: 202 },
  );
}
