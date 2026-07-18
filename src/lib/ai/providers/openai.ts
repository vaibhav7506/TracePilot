import { AiError } from "@/lib/ai/errors";
import type { AiProviderAdapter } from "@/lib/ai/types";
import type { AiProvider } from "@/lib/ai/types";
import { providerFetchError, providerSignal, readProviderJson } from "@/lib/ai/provider-http";

export function createOpenAiCompatibleAdapter(
  defaultBaseUrl: string,
  provider: Extract<AiProvider, "openai" | "groq">,
): AiProviderAdapter {
  return {
    async generate(request) {
      const baseUrl = (request.baseUrl || defaultBaseUrl).replace(/\/$/, "");
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${request.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: providerSignal(request.timeoutMs),
          body: JSON.stringify({
            model: request.model,
            messages: [
              { role: "system", content: request.systemPrompt },
              { role: "user", content: request.userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: request.temperature ?? 0.2,
            max_tokens: request.maxTokens ?? 3000,
          }),
        });
      } catch (cause) {
        throw providerFetchError(cause, provider);
      }
      if (!response.ok)
        throw new AiError(
          "PROVIDER_REQUEST",
          `AI provider request failed (${response.status}).`,
          provider,
        );
      const data = await readProviderJson<{
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      }>(response, provider);
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        model: data.model ?? request.model,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        },
      };
    },
  };
}

export const openAiAdapter = createOpenAiCompatibleAdapter("https://api.openai.com/v1", "openai");
