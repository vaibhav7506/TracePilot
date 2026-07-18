import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session-token";
import { apiError } from "@/lib/api-response";

export async function middleware(request: NextRequest) {
  const userId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (userId) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return apiError("Authentication required.", 401);
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/runs/:path*",
    "/settings/:path*",
    "/api/projects/:path*",
    "/api/runs/:path*",
    "/api/settings/:path*",
    "/api/user-api-keys/:path*",
    "/api/demo/seed",
  ],
};
