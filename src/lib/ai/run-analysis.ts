import { generateStructuredObject } from "@/lib/ai";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveAiProviderCandidatesForUser } from "@/lib/ai/resolve-user-provider";
import type { GenerateStructuredObjectInput, ResolvedAiConfig } from "@/lib/ai/types";
import type { z } from "zod";
import {
  BUG_ANALYSIS_SYSTEM_PROMPT,
  bugAnalysisSchema,
  buildBugAnalysisPrompt,
} from "@/lib/ai/prompts/bug-analysis";
import {
  TEST_PLAN_SYSTEM_PROMPT,
  buildTestPlanPrompt,
  testPlanSchema,
} from "@/lib/ai/prompts/test-plan";
import {
  TEST_GENERATION_SYSTEM_PROMPT,
  buildTestGenerationPrompt,
  generatedTestSchema,
} from "@/lib/ai/prompts/test-generation";

type PromptInput<T extends z.ZodTypeAny> = Omit<
  GenerateStructuredObjectInput<T>,
  "provider" | "apiKey" | "model" | "baseUrl"
>;

async function configsFor(userId?: string | null): Promise<ResolvedAiConfig[]> {
  if (userId) return resolveAiProviderCandidatesForUser(userId);
  const platform = await resolveAiConfig();
  return platform ? [platform] : [];
}

async function generateWithFallback<T extends z.ZodTypeAny>(
  userId: string | null | undefined,
  input: PromptInput<T>,
) {
  const configs = await configsFor(userId);
  const deadline = Date.now() + (input.timeoutMs ?? 30_000);
  let lastError: unknown;
  for (const config of configs) {
    const timeoutMs = deadline - Date.now();
    if (timeoutMs <= 0) break;
    try {
      return await generateStructuredObject({ ...input, ...config, timeoutMs });
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

export async function generateTestPlan(input: {
  baseUrl: string;
  goal: string;
  userId?: string | null;
  timeoutMs?: number;
}) {
  return generateWithFallback(input.userId, {
    systemPrompt: TEST_PLAN_SYSTEM_PROMPT,
    userPrompt: buildTestPlanPrompt(input),
    schema: testPlanSchema,
    temperature: 0.1,
    maxTokens: 1800,
    timeoutMs: input.timeoutMs,
  });
}

export async function analyzeRun(input: unknown, userId?: string | null, timeoutMs?: number) {
  return generateWithFallback(userId, {
    systemPrompt: BUG_ANALYSIS_SYSTEM_PROMPT,
    userPrompt: buildBugAnalysisPrompt(input),
    schema: bugAnalysisSchema,
    temperature: 0.1,
    maxTokens: 6000,
    timeoutMs,
  });
}

export async function generatePlaywrightTests(input: unknown, userId?: string | null) {
  return generateWithFallback(userId, {
    systemPrompt: TEST_GENERATION_SYSTEM_PROMPT,
    userPrompt: buildTestGenerationPrompt(input),
    schema: generatedTestSchema,
    temperature: 0.1,
    maxTokens: 8000,
  });
}
