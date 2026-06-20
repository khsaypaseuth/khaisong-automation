import { NextResponse } from "next/server";
import { requireSession, badRequest, notFound } from "@/lib/api";
import { campaignUpdateSchema } from "@/lib/validations/campaign";
import {
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "@/server/campaigns/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) return notFound("Campaign not found");
  return NextResponse.json(campaign);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = campaignUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const updated = await updateCampaign(id, parsed.data);
  if (!updated) return notFound("Campaign not found");
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  await deleteCampaign(id);
  return NextResponse.json({ ok: true });
}
