export type AiErrorCode =
  | "CONFIGURATION"
  | "PROVIDER_REQUEST"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "EMPTY_RESPONSE"
  | "INVALID_JSON"
  | "VALIDATION";

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly provider?: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AiError";
  }
}

export type SafeAiFailure = {
  code: AiErrorCode | "UNKNOWN";
  reason: string;
  provider?: string;
};

const safeFailureReasons: Record<AiErrorCode, string> = {
  CONFIGURATION: "AI provider key or model is not configured.",
  PROVIDER_REQUEST: "The AI provider request failed.",
  TIMEOUT: "The AI provider request timed out.",
  INVALID_RESPONSE: "The AI provider returned an unreadable response.",
  EMPTY_RESPONSE: "The AI provider returned an empty response.",
  INVALID_JSON: "The AI provider returned invalid JSON.",
  VALIDATION: "The AI response did not match the required analysis structure.",
};

/**
 * Convert any provider/validation failure into metadata that is safe to log
 * and persist. Causes and response bodies are deliberately excluded because
 * they may contain request context or provider-controlled content.
 */
export function describeAiFailure(error: unknown): SafeAiFailure {
  if (error instanceof AiError) {
    return {
      code: error.code,
      reason: safeFailureReasons[error.code],
      provider: error.provider,
    };
  }
  return { code: "UNKNOWN", reason: "Unexpected AI analysis failure." };
}
