import { z } from "zod";
import type { AiProvider, ResolvedAiConfig } from "@/lib/ai";

export const providerSchema = z.enum(["openai", "groq", "anthropic", "gemini"], {
  errorMap: () => ({ message: "Provider must be OpenAI, Groq, Anthropic, or Gemini." }),
});
export const modelSchema = z.string().trim().min(1, "A non-empty model name is required.").max(200);
const baseUrlSchema = z
  .string()
  .url("Provider base URL must be a valid URL.")
  .superRefine((value, context) => {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      context.addIssue({ code: "custom", message: "Provider base URL must use HTTP or HTTPS." });
    }
    if (url.username || url.password) {
      context.addIssue({ code: "custom", message: "Provider base URL must not contain credentials." });
    }
    if (url.search || url.hash) {
      context.addIssue({ code: "custom", message: "Provider base URL must not contain a query or hash." });
    }
  })
  .optional();

export type ProviderConfigurationStatus =
  | "connected"
  | "missing-key"
  | "missing-model"
  | "invalid-configuration";

export type ProviderDisplay = {
  provider: AiProvider;
  label: string;
  active: boolean;
  model: string | null;
  baseUrl: string | null;
  hasApiKey: boolean;
  status: ProviderConfigurationStatus;
};

const labels: Record<AiProvider, string> = {
  openai: "OpenAI",
  groq: "Groq",
  anthropic: "Anthropic",
  gemini: "Gemini",
};

const defaults: Partial<Record<AiProvider, string>> = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

function providerValues(provider: AiProvider) {
  const prefix = provider.toUpperCase();
  const active = (process.env.AI_PROVIDER || "groq").toLowerCase() === provider;
  return {
    provider,
    active,
    apiKey: (active ? process.env.AI_API_KEY : undefined) || process.env[`${prefix}_API_KEY`] || "",
    model: (active ? process.env.AI_MODEL : undefined) || process.env[`${prefix}_MODEL`] || "",
    baseUrl:
      (active ? process.env.AI_BASE_URL : undefined) ||
      process.env[`${prefix}_BASE_URL`] ||
      defaults[provider],
  };
}

export function getProviderDisplay(provider: AiProvider): ProviderDisplay {
  const values = providerValues(provider);
  const validBaseUrl = baseUrlSchema.safeParse(values.baseUrl || undefined).success;
  const validModel = modelSchema.safeParse(values.model).success;
  let status: ProviderConfigurationStatus = "connected";
  if (!values.apiKey) status = "missing-key";
  else if (!values.model) status = "missing-model";
  else if (!validBaseUrl || !validModel) status = "invalid-configuration";
  return {
    provider,
    label: labels[provider],
    active: values.active,
    model: values.model || null,
    baseUrl: values.baseUrl || null,
    hasApiKey: Boolean(values.apiKey),
    status,
  };
}

export function getAllProviderDisplays(): ProviderDisplay[] {
  return providerSchema.options.map((provider) => getProviderDisplay(provider));
}

export function resolveProviderConfig(providerInput?: unknown): ResolvedAiConfig | null {
  const provider = providerInput
    ? providerSchema.parse(providerInput)
    : providerSchema.parse((process.env.AI_PROVIDER || "groq").toLowerCase());
  const values = providerValues(provider);
  if (!values.apiKey || !values.model) return null;
  return {
    provider,
    apiKey: values.apiKey,
    model: modelSchema.parse(values.model),
    baseUrl: baseUrlSchema.parse(values.baseUrl || undefined),
  };
}
