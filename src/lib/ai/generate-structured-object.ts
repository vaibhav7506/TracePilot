import { AiError } from "@/lib/ai/errors";
import { parseJsonResponse } from "@/lib/ai/parse-json";
import { getProviderAdapter } from "@/lib/ai/provider-registry";
import type { GenerateStructuredObjectInput, StructuredObjectResponse } from "@/lib/ai/types";
import type { z } from "zod";

export async function generateStructuredObject<T extends z.ZodTypeAny>(
  input: GenerateStructuredObjectInput<T>,
): Promise<StructuredObjectResponse<z.infer<T>>> {
  if (!input.apiKey.trim() || !input.model.trim())
    throw new AiError(
      "CONFIGURATION",
      "AI provider key or model is not configured.",
      input.provider,
    );
  const response = await getProviderAdapter(input.provider).generate(input);
  const parsed = parseJsonResponse(response.text);
  const record = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
  const candidates = [
    parsed,
    record?.analysis,
    record?.data,
    record?.result,
    record?.output,
  ].filter((candidate) => candidate !== undefined);
  let validation = input.schema.safeParse(candidates[0]);
  for (const candidate of candidates.slice(1)) {
    if (validation.success) break;
    validation = input.schema.safeParse(candidate);
  }
  if (!validation.success) {
    throw new AiError(
      "VALIDATION",
      "AI response did not match the expected structure.",
      input.provider,
      { cause: validation.error },
    );
  }
  return {
    object: validation.data,
    provider: input.provider,
    model: response.model,
    usage: response.usage,
  };
}
