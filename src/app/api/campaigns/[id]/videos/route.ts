import { NextResponse } from "next/server";
import { requireSession, badRequest } from "@/lib/api";
import { videoCreateSchema } from "@/lib/validations/video";
import { createVideo, listVideosByCampaign } from "@/server/videos/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const videos = await listVideosByCampaign(id);
  return NextResponse.json(videos);
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = videoCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const video = await createVideo(id, parsed.data);
  return NextResponse.json(video, { status: 201 });
}
