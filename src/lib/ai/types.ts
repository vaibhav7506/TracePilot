import type { z } from "zod";

export type AiProvider = "openai" | "groq" | "anthropic" | "gemini";

export interface ProviderRequest {
  apiKey: string;
  baseUrl?: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ProviderResponse {
  text: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface AiProviderAdapter {
  generate(request: ProviderRequest): Promise<ProviderResponse>;
}

export interface GenerateStructuredObjectInput<T extends z.ZodTypeAny> extends ProviderRequest {
  provider: AiProvider;
  schema: T;
}

export interface StructuredObjectResponse<T> {
  object: T;
  provider: AiProvider;
  model: string;
  usage?: ProviderResponse["usage"];
}

export interface ResolvedAiConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}
