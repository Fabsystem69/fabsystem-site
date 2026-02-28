import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthedFromRequestCookie } from "@/lib/auth-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("fabsystem_session")?.value;
    const ok = await isAuthedFromRequestCookie(token);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};