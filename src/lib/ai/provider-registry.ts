import { anthropicAdapter } from "@/lib/ai/providers/anthropic";
import { geminiAdapter } from "@/lib/ai/providers/gemini";
import { groqAdapter } from "@/lib/ai/providers/groq";
import { openAiAdapter } from "@/lib/ai/providers/openai";
import type { AiProvider, AiProviderAdapter } from "@/lib/ai/types";

const registry: Record<AiProvider, AiProviderAdapter> = {
  openai: openAiAdapter,
  groq: groqAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
};

export function getProviderAdapter(provider: AiProvider): AiProviderAdapter {
  return registry[provider];
}
