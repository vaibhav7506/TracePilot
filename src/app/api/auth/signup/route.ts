import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  assertAuthConfigured,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session-token";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { fieldErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("Check the highlighted fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  }
  try {
    assertAuthConfigured();
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing)
      return apiError("An account already exists for this email.", 409);
    const user = await prisma.user.create({
      data: { email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) },
      select: { id: true, email: true },
    });
    const response = apiSuccess({ user }, 201);
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user.id), sessionCookieOptions);
    return response;
  } catch {
    return apiError("Could not create the account. Check server configuration and try again.", 500);
  }
}
