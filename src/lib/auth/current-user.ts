import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session-token";

export type SafeUser = { id: string; email: string };

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const userId = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  } catch {
    return null;
  }
}
