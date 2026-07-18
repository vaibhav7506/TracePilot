import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { encryptSecret, maskSecret } from "@/lib/security/encryption";
import { prisma } from "@/lib/prisma";
import { safeUserApiKeySelect } from "@/lib/user-api-keys";
import { resourceIdSchema, fieldErrors } from "@/lib/validations";
import { updateUserApiKeySchema } from "@/lib/validations/byok";
import { assertPubliclyResolvedUrl } from "@/lib/runner/network-guard";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id } = await params;
  if (!resourceIdSchema.safeParse(id).success)
    return apiError("Invalid provider key ID.", 400);
  const parsed = updateUserApiKeySchema.safeParse(await request.json().catch(() => null));
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
    const existing = await prisma.userApiKey.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return apiError("Provider key not found.", 404);
    const key = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault)
        await tx.userApiKey.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      return tx.userApiKey.update({
        where: { id },
        data: {
          model: parsed.data.model,
          baseUrl: parsed.data.baseUrl,
          ...(parsed.data.isDefault === true ? { isDefault: true } : {}),
          ...(parsed.data.apiKey
            ? {
                encryptedApiKey: encryptSecret(parsed.data.apiKey),
                keyPreview: maskSecret(parsed.data.apiKey),
              }
            : {}),
        },
        select: safeUserApiKeySelect,
      });
    });
    return apiSuccess({ key });
  } catch {
    return apiError("Could not update this provider key.", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id } = await params;
  if (!resourceIdSchema.safeParse(id).success)
    return apiError("Invalid provider key ID.", 400);
  try {
    const existing = await prisma.userApiKey.findFirst({
      where: { id, userId: user.id },
      select: { id: true, isDefault: true },
    });
    if (!existing) return apiError("Provider key not found.", 404);
    await prisma.$transaction(async (tx) => {
      await tx.userApiKey.delete({ where: { id: existing.id } });
      if (existing.isDefault) {
        const replacement = await tx.userApiKey.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });
        if (replacement)
          await tx.userApiKey.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    });
    return apiSuccess({ deleted: true });
  } catch {
    return apiError("Could not delete this provider key.", 500);
  }
}
