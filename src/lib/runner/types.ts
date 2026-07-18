/**
 * Shared types for the deterministic Playwright runner. AI gateway types remain
 * separate so deterministic exploration does not depend on a provider.
 */

export type StepResult = "passed" | "failed" | "skipped";

export type FindingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingCategory =
  | "CONSOLE"
  | "NETWORK"
  | "ROUTE"
  | "UI"
  | "ACCESSIBILITY"
  | "AUTH"
  | "FORM"
  | "UNKNOWN";

/** Optional login context. Held only for the duration of a run — never stored. */
export interface RunnerCredentials {
  loginUrl?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
}

export interface RunnerInput {
  runId: string;
  userId?: string | null;
  baseUrl: string;
  goal: string;
  credentials?: RunnerCredentials | undefined;
}

export interface RunnerStep {
  order: number;
  action: string;
  target: string | null;
  url: string | null;
  result: StepResult;
  screenshotPath: string | null;
  consoleErrors: string[];
  networkErrors: string[];
}

export interface RunnerFinding {
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  url: string | null;
  selector: string | null;
  screenshotPath: string | null;
  reproductionSteps: string[];
}

/** Summary returned to the API after a run finishes (or fails). */
export interface RunnerSummary {
  status: "COMPLETED" | "FAILED";
  summary: string;
  score: number;
  stepCount: number;
  findingCount: number;
  /** Present only on FAILED — a safe, credential-free message. */
  error?: string;
}
