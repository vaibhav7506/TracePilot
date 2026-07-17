/**
 * Safety rails for autonomous exploration. The runner is deterministic and
 * conservative: it clicks only safe, internal links and never performs actions
 * that could mutate state, spend money, or destroy data.
 */

/** Hard limits — bound both step count and wall-clock runtime. */
export const RUNNER_LIMITS = {
  /** Maximum exploration steps (navigations + interactions) before stopping. */
  maxSteps: 14,
  /** Maximum total runtime for a run, in milliseconds. */
  maxRuntimeMs: 90_000,
  /** Per-navigation timeout, in milliseconds. */
  navigationTimeoutMs: 20_000,
  /** Max internal links to consider per page. */
  maxLinksPerPage: 8,
} as const;

/**
 * Words that mark a destructive or high-consequence action. If any appears in a
 * link/button's text, href, or accessible name, the runner refuses to click it.
 * Matched case-insensitively as substrings, so "Confirm order" catches "order".
 */
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
  // Adjacent high-risk verbs kept conservative on purpose.
  "pay",
  "order",
  "destroy",
  "deactivate",
  "logout",
  "sign out",
  "log out",
] as const;

/** True if the given text contains any destructive keyword. */
export function isDestructive(...texts: Array<string | null | undefined>): boolean {
  const haystack = texts
    .filter((t): t is string => Boolean(t))
    .join(" ")
    .toLowerCase();
  if (!haystack) return false;
  return DESTRUCTIVE_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

/**
 * Redact anything that looks like a submitted credential from a string before
 * it is logged or persisted. Belt-and-suspenders: the runner already avoids
 * logging passwords, but network/console lines can echo values.
 */
export function redactCredentials(text: string, credentials?: { email?: string; password?: string }): string {
  let out = text;
  if (credentials?.password) {
    out = out.split(credentials.password).join("«redacted»");
  }
  if (credentials?.email) {
    out = out.split(credentials.email).join("«redacted-email»");
  }
  return out;
}
