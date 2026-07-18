import { AiError } from "@/lib/ai/errors";
import type { AiProviderAdapter } from "@/lib/ai/types";
import { providerFetchError, providerSignal, readProviderJson } from "@/lib/ai/provider-http";

export const geminiAdapter: AiProviderAdapter = {
  async generate(request) {
    const baseUrl = (request.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(
      /\/$/,
      "",
    );
    let response: Response;
    try {
      response = await fetch(
        `${baseUrl}/models/${encodeURIComponent(request.model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Keep the credential out of URLs, reverse-proxy access logs, and traces.
            "x-goog-api-key": request.apiKey,
          },
          signal: providerSignal(request.timeoutMs),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: request.systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
            generationConfig: {
              temperature: request.temperature ?? 0.2,
              maxOutputTokens: request.maxTokens ?? 3000,
              responseMimeType: "application/json",
            },
          }),
        },
      );
    } catch (cause) {
      throw providerFetchError(cause, "gemini");
    }
    if (!response.ok)
      throw new AiError(
        "PROVIDER_REQUEST",
        `Gemini request failed (${response.status}).`,
        "gemini",
      );
    const data = await readProviderJson<{
      modelVersion?: string;
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    }>(response, "gemini");
    return {
      text: data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "",
      model: data.modelVersion ?? request.model,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount,
        outputTokens: data.usageMetadata?.candidatesTokenCount,
      },
    };
  },
};
