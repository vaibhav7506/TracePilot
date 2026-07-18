import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { generateStructuredObject } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getProviderDisplay,
  providerSchema,
  resolveProviderConfig,
} from "@/lib/settings/provider-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ provider: providerSchema.optional() }).strict();
const healthSchema = z.object({ ok: z.literal(true) });

// TODO(rate-limit): add a per-user/IP limiter when a shared rate-limit utility exists.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return apiError("Request body must be valid JSON.", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid provider selection.", 400);
  }

  const activeProvider = providerSchema.safeParse(
    (process.env.AI_PROVIDER || "groq").toLowerCase(),
  );
  if (!parsed.data.provider && !activeProvider.success) {
    return apiError("AI_PROVIDER is invalid.", 400, { providerStatus: "invalid-configuration" });
  }
  const provider = parsed.data.provider || (activeProvider.success ? activeProvider.data : "groq");
  const display = getProviderDisplay(provider);
  let config;
  try {
    config = resolveProviderConfig(provider);
  } catch {
    return apiError("Provider configuration is invalid.", 400, {
      provider,
      providerStatus: "invalid-configuration",
    });
  }
  if (!config) {
    const error =
      display.status === "missing-model"
        ? "Provider model is missing."
        : "Provider API key is missing.";
    return apiError(error, 400, { provider, providerStatus: display.status });
  }

  const startedAt = Date.now();
  try {
    const result = await generateStructuredObject({
      ...config,
      systemPrompt: "Return only the requested harmless provider health JSON.",
      userPrompt: 'Return exactly {"ok":true}.',
      schema: healthSchema,
      temperature: 0,
      maxTokens: 40,
    });
    return apiSuccess({
      provider: result.provider,
      model: result.model,
      providerStatus: "connected",
      latencyMs: Date.now() - startedAt,
      message: "Provider responded with valid structured JSON.",
    });
  } catch {
    return apiError(
      "Provider connection test failed. Check the server-side key, model, and base URL.",
      502,
      { provider, model: config.model, providerStatus: "connection-failed" },
    );
  }
}
