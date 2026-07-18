const unsafeIntentPattern =
  /(?:\bpayment\b|\bcheckout\b|\bpurchase\b|\bbuy\b|\bconfirm\s+order\b|\btransfer\b|\bwithdraw\b|\bdelete\b|\bremove\b|\bunsubscribe\b|\bcancel\s+subscription\b|\bcredit\s+card\b|\bcard\s+number\b|\bcvv\b|\bcvc\b)/i;

const secretPattern =
  /\b(?:sk-[A-Za-z0-9_-]{12,}|gsk_[A-Za-z0-9_-]{12,}|sk-ant-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,})\b/;
const providerKeyEnvironmentPattern =
  /process\.env\.(?:OPENAI|GROQ|ANTHROPIC|GEMINI|AI)_API_KEY/;
const paymentCardNumberPattern = /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13})\b/;
const activeInteractionPattern =
  /(?:\.click\s*\(|\.dblclick\s*\(|\.fill\s*\(|\.press\s*\(|\.check\s*\(|\.uncheck\s*\(|request\.(?:post|put|patch|delete)\s*\()/i;

const defaultBaseUrlPattern =
  /const\s+baseURL\s*=\s*process\.env\.TEST_BASE_URL\s*\?\?\s*["']http:\/\/localhost:3000["']\s*;/;

export function containsUnsafeTestIntent(...values: Array<unknown>): boolean {
  return values.some((value) => typeof value === "string" && unsafeIntentPattern.test(value));
}

function routePath(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    const base = new URL(baseUrl);
    return url.origin === base.origin ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

function literalRoutes(code: string): string[] {
  const routes: string[] = [];
  const pattern = /(["'])(\/[^"'\r\n]*)\1/g;
  for (const match of code.matchAll(pattern)) {
    if (match[2]) routes.push(match[2]);
  }
  return routes;
}

export type GeneratedTestSafetyContext = {
  baseUrl: string;
  discoveredRoutes: string[];
  authUsed: boolean;
};

export type GeneratedTestCandidate = {
  kind: string;
  title: string;
  fileName: string;
  code: string;
};

/**
 * Final deterministic boundary for provider-generated code. This intentionally
 * permits only read-oriented tests: navigation and assertions, never clicks,
 * form filling, submissions, or mutating HTTP requests.
 */
export function generatedTestIsSafe(
  file: GeneratedTestCandidate,
  context: GeneratedTestSafetyContext,
): boolean {
  const code = file.code;
  if (containsUnsafeTestIntent(file.title, file.fileName, code)) return false;
  if (secretPattern.test(code) || providerKeyEnvironmentPattern.test(code)) return false;
  if (paymentCardNumberPattern.test(code) || activeInteractionPattern.test(code)) return false;
  if (!code.includes("@playwright/test") || !code.includes("//")) return false;
  if (!defaultBaseUrlPattern.test(code)) return false;
  if (context.baseUrl !== "http://localhost:3000" && code.includes(context.baseUrl)) return false;
  if (file.kind === "auth" && (!code.includes("TEST_EMAIL") || !code.includes("TEST_PASSWORD"))) {
    return false;
  }
  if (!context.authUsed && (code.includes("TEST_EMAIL") || code.includes("TEST_PASSWORD"))) {
    return false;
  }

  const allowedRoutes = new Set(
    context.discoveredRoutes
      .map((route) => routePath(route, context.baseUrl))
      .filter((route): route is string => Boolean(route)),
  );
  allowedRoutes.add("/");
  return literalRoutes(code).every((route) => allowedRoutes.has(route));
}
