/**
 * Centralized, lightly-typed access to environment configuration.
 *
 * This phase only *reads* these values (e.g. to show provider status on the
 * settings page). Validation stays intentionally soft so the app runs before
 * every value is filled in. Stricter parsing lands when the agent/AI layers do.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  ai: {
    provider: process.env.AI_PROVIDER ?? "",
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL ?? "",
  },
} as const;

/** True when a value is present and non-empty. */
export function isConfigured(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
