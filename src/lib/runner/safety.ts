import { getPlatformSettings } from "@/lib/settings/config";

const settings = getPlatformSettings().runner;

/** Central, validated runner limits and capture/safety policy. */
export const RUNNER_CONFIG = {
  ...settings,
  maxLinksPerPage: 8,
} as const;

export const DESTRUCTIVE_KEYWORDS: readonly string[] = [
  "delete",
  "remove",
  "cancel subscription",
  "unsubscribe",
  "payment",
  "checkout",
  "purchase",
  "buy",
  "confirm order",
  "transfer",
  "withdraw",
  "pay",
  "order",
  "destroy",
  "deactivate",
  "logout",
  "sign out",
  "log out",
] as const;

export const SAFETY_CONFIG = {
  destructiveKeywords: DESTRUCTIVE_KEYWORDS,
  destructiveActionProtection: settings.destructiveActionProtection,
  sameDomainOnly: settings.sameDomainOnly,
  allowPrivateNetwork: settings.allowPrivateNetwork,
} as const;

export function isDestructive(...texts: Array<string | null | undefined>): boolean {
  const haystack = texts
    .filter((text): text is string => Boolean(text))
    .join(" ")
    .toLowerCase();
  if (!haystack) return false;
  return DESTRUCTIVE_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function redactCredentials(
  text: string,
  credentials?: { email?: string; password?: string },
): string {
  let output = text;
  if (credentials?.password) output = output.split(credentials.password).join("«redacted»");
  if (credentials?.email) output = output.split(credentials.email).join("«redacted-email»");
  return output;
}
