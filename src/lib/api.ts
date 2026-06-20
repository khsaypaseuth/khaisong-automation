import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

/** Returns the session, or a 401 NextResponse to short-circuit the handler. */
export async function requireSession(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session };
}

export function badRequest(error: unknown) {
  return NextResponse.json({ error: "Invalid input", details: error }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Placeholder for capabilities arriving in a later phase. */
export function notImplemented(phase: string) {
  return NextResponse.json(
    { error: "Not implemented yet", phase },
    { status: 501 },
  );
}
