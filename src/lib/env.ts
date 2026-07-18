/**
 * Centralized, lightly-typed access to environment configuration.
 *
 * This display helper never leaves the server. Operational validation lives at
 * each boundary (provider resolution, runner settings, and request schemas) so
 * the UI can still render a useful configuration state when a value is absent.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  ai: {
    provider: process.env.AI_PROVIDER ?? "groq",
    model: process.env.AI_MODEL ?? "",
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL ?? "",
  },
} as const;

/** True when a value is present and non-empty. */
export function isConfigured(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
