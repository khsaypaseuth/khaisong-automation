import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { listCalendarEntries } from "@/server/calendar/service";

export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const entries = await listCalendarEntries();
  return NextResponse.json(entries);
}
