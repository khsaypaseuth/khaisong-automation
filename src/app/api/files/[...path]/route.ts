import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { readFile, contentTypeFor } from "@/lib/storage";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const { path: segments } = await params;
  const relativePath = segments.join("/");

  try {
    const data = await readFile(relativePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(relativePath),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
