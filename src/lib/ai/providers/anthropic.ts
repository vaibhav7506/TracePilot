import { AiError } from "@/lib/ai/errors";
import type { AiProviderAdapter } from "@/lib/ai/types";
import { providerFetchError, providerSignal, readProviderJson } from "@/lib/ai/provider-http";

export const anthropicAdapter: AiProviderAdapter = {
  async generate(request) {
    const baseUrl = (request.baseUrl || "https://api.anthropic.com/v1").replace(/\/$/, "");
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": request.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        signal: providerSignal(request.timeoutMs),
        body: JSON.stringify({
          model: request.model,
          system: request.systemPrompt,
          messages: [{ role: "user", content: request.userPrompt }],
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxTokens ?? 3000,
        }),
      });
    } catch (cause) {
      throw providerFetchError(cause, "anthropic");
    }
    if (!response.ok)
      throw new AiError(
        "PROVIDER_REQUEST",
        `Anthropic request failed (${response.status}).`,
        "anthropic",
      );
    const data = await readProviderJson<{
      model?: string;
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    }>(response, "anthropic");
    return {
      text: data.content?.find((item) => item.type === "text")?.text ?? "",
      model: data.model ?? request.model,
      usage: { inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens },
    };
  },
};
