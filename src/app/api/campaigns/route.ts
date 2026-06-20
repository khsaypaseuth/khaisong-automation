import { NextResponse } from "next/server";
import { requireSession, badRequest } from "@/lib/api";
import { campaignCreateSchema } from "@/lib/validations/campaign";
import { createCampaign, listCampaigns } from "@/server/campaigns/service";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const campaigns = await listCampaigns();
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const campaign = await createCampaign(parsed.data, auth.session.userId);
  return NextResponse.json(campaign, { status: 201 });
}
