import { resolveProviderConfig } from "@/lib/settings/provider-config";
import { resolveAiProviderForUser } from "@/lib/ai/resolve-user-provider";

/** Resolve the active environment-backed provider without exposing its key. */
export async function resolveAiConfig(userId?: string | null) {
  if (userId) return resolveAiProviderForUser(userId);
  try {
    return resolveProviderConfig();
  } catch {
    return null;
  }
}
