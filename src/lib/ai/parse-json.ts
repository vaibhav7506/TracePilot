import { AiError } from "@/lib/ai/errors";

function firstBalancedObject(value: string): string | null {
  const start = value.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const character = value[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }
  return null;
}

function conservativeJsonRepairs(value: string): string {
  return value
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

export function parseJsonResponse(text: string): unknown {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) throw new AiError("EMPTY_RESPONSE", "The AI provider returned an empty response.");
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const candidates = Array.from(
    new Set(
      [unfenced, firstBalancedObject(unfenced)]
        .filter((candidate): candidate is string => Boolean(candidate))
        .flatMap((candidate) => [candidate, conservativeJsonRepairs(candidate)]),
    ),
  );
  let cause: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      cause ??= error;
    }
  }
  throw new AiError("INVALID_JSON", "The AI provider did not return valid JSON.", undefined, {
    cause,
  });
}
