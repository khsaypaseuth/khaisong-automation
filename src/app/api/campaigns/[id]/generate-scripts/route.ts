import { NextResponse } from "next/server";
import { requireSession, notFound } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dispatchGenerateScripts } from "@/server/jobs/dispatch";
import { resolveKeys } from "@/server/settings/keys";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { openaiKey } = await resolveKeys();
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured (Settings or env)" },
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
