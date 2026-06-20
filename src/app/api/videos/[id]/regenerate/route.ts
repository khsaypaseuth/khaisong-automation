import { requireSession, notImplemented } from "@/lib/api";

export async function POST() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  return notImplemented("Phase 6 — regenerate");
}
