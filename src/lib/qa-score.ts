export type QaScoreSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type QaScoreInput = {
  findings: Array<{ severity: QaScoreSeverity }>;
  runStatus: string;
  aiAnalysisStatus: string;
};

export type ResolvedQaScoreInput = QaScoreInput & {
  aiScore: unknown;
};

const severityPenalty: Record<QaScoreSeverity, number> = {
  CRITICAL: 30,
  HIGH: 20,
  MEDIUM: 10,
  LOW: 5,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Deterministic QA health score. Higher is always better. */
export function calculateDeterministicQaScore(input: QaScoreInput): number {
  let score = 100;
  for (const finding of input.findings) score -= severityPenalty[finding.severity];

  if (input.runStatus === "FAILED") score = Math.min(score, 30);
  if (input.runStatus === "COMPLETED" && input.aiAnalysisStatus === "FAILED") score -= 5;

  return clampScore(score);
}

function normalizeAiScore(value: unknown): { raw: number; normalized: number } | null {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) return null;
  const normalized = raw >= 0 && raw <= 1 ? raw * 100 : raw;
  return { raw, normalized: clampScore(normalized) };
}

/**
 * Accept an AI score only after scaling and a plausibility check against the
 * deterministic findings. This prevents a confidence-like `1` from becoming
 * a 1/100 health score or an implausible perfect score when issues exist.
 */
export function resolveQaHealthScore(input: ResolvedQaScoreInput): number {
  const deterministic = calculateDeterministicQaScore(input);
  if (input.aiAnalysisStatus !== "COMPLETED") return deterministic;

  const ai = normalizeAiScore(input.aiScore);
  if (!ai) return deterministic;

  const hasFindings = input.findings.length > 0;
  const rawOneWithFindings = ai.raw === 1 && hasFindings;
  const differsMaterially = Math.abs(ai.normalized - deterministic) > 20;
  const implausiblyPerfect = hasFindings && ai.normalized >= deterministic + 10;
  if (rawOneWithFindings || differsMaterially || implausiblyPerfect) return deterministic;

  const score = clampScore(ai.normalized);
  return input.runStatus === "FAILED" ? Math.min(score, 30) : score;
}
