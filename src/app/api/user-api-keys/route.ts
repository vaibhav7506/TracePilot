import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptSecret, maskSecret } from "@/lib/security/encryption";
import { prisma } from "@/lib/prisma";
import { safeUserApiKeySelect } from "@/lib/user-api-keys";
import { createUserApiKeySchema } from "@/lib/validations/byok";
import { fieldErrors } from "@/lib/validations";
import { assertPubliclyResolvedUrl } from "@/lib/runner/network-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  try {
    const keys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: safeUserApiKeySelect,
    });
    return apiSuccess({ keys }, 200, { "Cache-Control": "private, no-store" });
  } catch {
    return apiError("Could not load connected providers.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const parsed = createUserApiKeySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError("Check the highlighted fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  if (parsed.data.baseUrl) {
    try {
      await assertPubliclyResolvedUrl(parsed.data.baseUrl);
    } catch (error) {
      return apiError(
        error instanceof Error ? error.message : "Provider base URL is not allowed.",
        400,
      );
    }
  }
  try {
    const existingCount = await prisma.userApiKey.count({ where: { userId: user.id } });
    const makeDefault = parsed.data.isDefault || existingCount === 0;
    const key = await prisma.$transaction(async (tx) => {
      if (makeDefault)
        await tx.userApiKey.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      return tx.userApiKey.upsert({
        where: { userId_provider: { userId: user.id, provider: parsed.data.provider } },
        create: {
          userId: user.id,
          provider: parsed.data.provider,
          encryptedApiKey: encryptSecret(parsed.data.apiKey),
          keyPreview: maskSecret(parsed.data.apiKey),
          model: parsed.data.model,
          baseUrl: parsed.data.baseUrl,
          isDefault: makeDefault,
        },
        update: {
          encryptedApiKey: encryptSecret(parsed.data.apiKey),
          keyPreview: maskSecret(parsed.data.apiKey),
          model: parsed.data.model,
          baseUrl: parsed.data.baseUrl ?? null,
          ...(makeDefault ? { isDefault: true } : {}),
        },
        select: safeUserApiKeySelect,
      });
    });
    return apiSuccess({ key }, 201);
  } catch {
    return apiError("Could not save this provider key. Verify its endpoint and encryption configuration.", 500);
  }
}
