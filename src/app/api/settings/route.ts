import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, badRequest } from "@/lib/api";
import { getSettingsMap, upsertSettings } from "@/server/settings/service";

const schema = z.record(z.string(), z.string());

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  return NextResponse.json(await getSettingsMap());
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  return NextResponse.json(await upsertSettings(parsed.data));
}
