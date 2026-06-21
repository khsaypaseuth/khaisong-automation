import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchVideoPipeline } from "@/server/jobs/dispatch";

type Params = { params: Promise<{ id: string }> };

// Runs the full asset pipeline (images → voice → render) for every video in the
// campaign that has storyboard scenes. Requires scripts to be generated first.
export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      videoPosts: {
        where: { scenes: { some: {} } },
        select: { id: true },
      },
    },
  });
  if (!campaign) return notFound("Campaign not found");

  if (campaign.videoPosts.length === 0) {
    return NextResponse.json(
      { error: "Generate scripts first — no videos with storyboards" },
      { status: 409 },
    );
  }

  await Promise.all(
    campaign.videoPosts.map((v) => dispatchVideoPipeline(v.id)),
  );

  await prisma.campaign.update({
    where: { id },
    data: { status: "GENERATING_ASSETS" },
  });

  return NextResponse.json(
    { ok: true, count: campaign.videoPosts.length },
    { status: 202 },
  );
}
