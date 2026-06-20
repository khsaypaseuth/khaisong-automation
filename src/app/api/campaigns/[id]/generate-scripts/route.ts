import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchGenerateScripts } from "@/server/jobs/dispatch";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return notFound("Campaign not found");

  if (campaign.status === "GENERATING_SCRIPTS") {
    return NextResponse.json(
      { error: "Generation already in progress" },
      { status: 409 },
    );
  }

  await dispatchGenerateScripts(id);
  return NextResponse.json(
    { ok: true, status: "GENERATING_SCRIPTS" },
    { status: 202 },
  );
}
