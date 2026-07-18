import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  assertAuthConfigured,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session-token";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { fieldErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("Check the highlighted fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  }
  try {
    assertAuthConfigured();
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return apiError("Email or password is incorrect.", 401);
    }
    const response = apiSuccess({ user: { id: user.id, email: user.email } });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user.id), sessionCookieOptions);
    return response;
  } catch {
    return apiError("Could not sign in. Check server configuration and try again.", 500);
  }
}
