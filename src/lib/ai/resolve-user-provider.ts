import "server-only";
import { decryptSecret } from "@/lib/security/encryption";
import { prisma } from "@/lib/prisma";
import { resolveProviderConfig } from "@/lib/settings/provider-config";
import type { ResolvedAiConfig } from "@/lib/ai/types";

/**
 * Platform credentials are a deliberate deployment policy, never an implicit
 * escape hatch. This prevents one user's failed BYOK request from silently
 * consuming a platform-owned account unless the operator opted in.
 */
export function platformAiFallbackAllowed(): boolean {
  return process.env.ALLOW_PLATFORM_AI_FALLBACK?.trim().toLowerCase() === "true";
}

function platformConfig(): ResolvedAiConfig | null {
  try {
    return resolveProviderConfig();
  } catch {
    return null;
  }
}

/** Resolve credentials in retry order: user BYOK, then explicitly allowed platform AI. */
export async function resolveAiProviderCandidatesForUser(
  userId: string,
): Promise<ResolvedAiConfig[]> {
  const candidates: ResolvedAiConfig[] = [];
  const saved = await prisma.userApiKey.findFirst({
    where: { userId, isDefault: true },
    orderBy: { updatedAt: "desc" },
    select: { provider: true, encryptedApiKey: true, model: true, baseUrl: true },
  });
  if (saved) {
    try {
      candidates.push({
        provider: saved.provider,
        apiKey: decryptSecret(saved.encryptedApiKey),
        model: saved.model,
        baseUrl: saved.baseUrl ?? undefined,
      });
    } catch {
      // Missing encryption configuration or rejected ciphertext is intentionally
      // opaque. No ciphertext, key, or provider response is logged or returned.
    }
  }
  if (platformAiFallbackAllowed()) {
    const platform = platformConfig();
    if (platform) candidates.push(platform);
  }
  return candidates;
}

export async function resolveAiProviderForUser(userId: string): Promise<ResolvedAiConfig | null> {
  return (await resolveAiProviderCandidatesForUser(userId))[0] ?? null;
}

export type UserAiAvailability =
  | { kind: "byok"; provider: string; model: string }
  | { kind: "platform"; provider: string; model: string }
  | { kind: "unavailable"; provider: null; model: null };

/** Safe metadata for server-rendered UI; never decrypts or selects key material. */
export async function getUserAiAvailability(userId: string): Promise<UserAiAvailability> {
  const saved = await prisma.userApiKey.findFirst({
    where: { userId, isDefault: true },
    select: { provider: true, model: true },
  });
  if (saved) return { kind: "byok", provider: saved.provider, model: saved.model };
  if (platformAiFallbackAllowed()) {
    const platform = platformConfig();
    if (platform) return { kind: "platform", provider: platform.provider, model: platform.model };
  }
  return { kind: "unavailable", provider: null, model: null };
}
