import { AiError } from "@/lib/ai/errors";
import type { AiProvider } from "@/lib/ai/types";

const DEFAULT_PROVIDER_TIMEOUT_MS = 30_000;

export function providerSignal(timeoutMs?: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS);
}

export function providerFetchError(cause: unknown, provider: AiProvider): AiError {
  const timedOut = cause instanceof Error && cause.name === "TimeoutError";
  return new AiError(
    timedOut ? "TIMEOUT" : "PROVIDER_REQUEST",
    timedOut ? "AI provider request timed out." : "Could not reach the AI provider.",
    provider,
    { cause },
  );
}

export async function readProviderJson<T>(response: Response, provider: AiProvider): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new AiError(
      "INVALID_RESPONSE",
      "AI provider returned an unreadable response.",
      provider,
      {
        cause,
      },
    );
  }
}
