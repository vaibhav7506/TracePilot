import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-token";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ signedOut: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
