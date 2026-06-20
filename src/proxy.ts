import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

const PUBLIC_PATHS = ["/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Logged-in user visiting /login → send to dashboard.
  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Unauthenticated user on a protected page → send to /login.
  if (!session && !isPublic) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Guard page routes only. API routes enforce auth themselves (401 JSON via
  // requireSession), so exclude /api, Next internals, and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4)$).*)"],
};
