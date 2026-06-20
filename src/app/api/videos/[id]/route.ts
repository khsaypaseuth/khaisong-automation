import { NextResponse } from "next/server";
import { requireSession, badRequest, notFound } from "@/lib/api";
import { videoUpdateSchema } from "@/lib/validations/video";
import { deleteVideo, getVideo, updateVideo } from "@/server/videos/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return notFound("Video not found");
  return NextResponse.json(video);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = videoUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const updated = await updateVideo(id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  await deleteVideo(id);
  return NextResponse.json({ ok: true });
}
