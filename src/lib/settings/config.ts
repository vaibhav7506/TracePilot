import { z } from "zod";

const booleanEnv = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const settingsEnvSchema = z.object({
  RUNNER_MAX_STEPS: z.coerce.number().int().min(1).max(50).default(14),
  RUNNER_MAX_RUNTIME_MS: z.coerce.number().int().min(10_000).max(300_000).default(90_000),
  RUNNER_NAVIGATION_TIMEOUT_MS: z.coerce.number().int().min(3_000).max(60_000).default(20_000),
  RUNNER_CAPTURE_SCREENSHOTS: booleanEnv.default("true"),
  RUNNER_CAPTURE_CONSOLE: booleanEnv.default("true"),
  RUNNER_CAPTURE_NETWORK: booleanEnv.default("true"),
  RUNNER_SAME_DOMAIN_ONLY: booleanEnv.default("true"),
  RUNNER_DESTRUCTIVE_PROTECTION: booleanEnv.default("true"),
  RUNNER_ALLOW_PRIVATE_NETWORK: booleanEnv.default("false"),
  TEST_INCLUDE_SMOKE: booleanEnv.default("true"),
  TEST_INCLUDE_NAVIGATION: booleanEnv.default("true"),
  TEST_INCLUDE_FORMS: booleanEnv.default("true"),
  TEST_INCLUDE_REGRESSIONS: booleanEnv.default("true"),
});

export const runnerSettingsSchema = z.object({
  maxSteps: z.number().int().min(1).max(50),
  maxRuntimeMs: z.number().int().min(10_000).max(300_000),
  navigationTimeoutMs: z.number().int().min(3_000).max(60_000),
  captureScreenshots: z.boolean(),
  captureConsoleErrors: z.boolean(),
  captureNetworkFailures: z.boolean(),
  sameDomainOnly: z.boolean(),
  destructiveActionProtection: z.boolean(),
  allowPrivateNetwork: z.boolean(),
});

export const testGenerationSettingsSchema = z.object({
  includeSmokeTests: z.boolean(),
  includeNavigationTests: z.boolean(),
  includeFormTests: z.boolean(),
  includeRegressionTests: z.boolean(),
});

export type RunnerSettings = z.infer<typeof runnerSettingsSchema>;
export type TestGenerationSettings = z.infer<typeof testGenerationSettingsSchema>;

export function getPlatformSettings(): {
  runner: RunnerSettings;
  testGeneration: TestGenerationSettings;
} {
  const parsed = settingsEnvSchema.parse(process.env);
  return {
    runner: runnerSettingsSchema.parse({
      maxSteps: parsed.RUNNER_MAX_STEPS,
      maxRuntimeMs: parsed.RUNNER_MAX_RUNTIME_MS,
      navigationTimeoutMs: parsed.RUNNER_NAVIGATION_TIMEOUT_MS,
      captureScreenshots: parsed.RUNNER_CAPTURE_SCREENSHOTS,
      captureConsoleErrors: parsed.RUNNER_CAPTURE_CONSOLE,
      captureNetworkFailures: parsed.RUNNER_CAPTURE_NETWORK,
      sameDomainOnly: parsed.RUNNER_SAME_DOMAIN_ONLY,
      destructiveActionProtection: parsed.RUNNER_DESTRUCTIVE_PROTECTION,
      allowPrivateNetwork:
        process.env.NODE_ENV === "development" && parsed.RUNNER_ALLOW_PRIVATE_NETWORK,
    }),
    testGeneration: testGenerationSettingsSchema.parse({
      includeSmokeTests: parsed.TEST_INCLUDE_SMOKE,
      includeNavigationTests: parsed.TEST_INCLUDE_NAVIGATION,
      includeFormTests: parsed.TEST_INCLUDE_FORMS,
      includeRegressionTests: parsed.TEST_INCLUDE_REGRESSIONS,
    }),
  };
}
