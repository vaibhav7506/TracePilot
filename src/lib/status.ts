/**
 * Presentation mapping for run/finding statuses. Kept as plain string unions
 * (mirroring the Prisma enums) so client components don't pull in the Prisma
 * client. Every status maps to an in-palette badge variant — no blue/green/
 * yellow; differentiation comes from weight, not hue.
 */
export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
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

type BadgeVariant = "neutral" | "ruby" | "rust" | "outline" | "muted";

export const runStatusMeta: Record<
  RunStatus,
  { label: string; variant: BadgeVariant; dot: boolean }
> = {
  QUEUED: { label: "Queued", variant: "muted", dot: true },
  RUNNING: { label: "Running", variant: "ruby", dot: true },
  COMPLETED: { label: "Completed", variant: "neutral", dot: true },
  FAILED: { label: "Failed", variant: "ruby", dot: false },
};

export const severityMeta: Record<FindingSeverity, { label: string; variant: BadgeVariant }> = {
  LOW: { label: "Low", variant: "muted" },
  MEDIUM: { label: "Medium", variant: "rust" },
  HIGH: { label: "High", variant: "ruby" },
  CRITICAL: { label: "Critical", variant: "ruby" },
};

export const severityOrder: FindingSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const categoryMeta: Record<FindingCategory, { label: string }> = {
  CONSOLE: { label: "Console" },
  NETWORK: { label: "Network" },
  ROUTE: { label: "Route" },
  UI: { label: "UI" },
  ACCESSIBILITY: { label: "Accessibility" },
  AUTH: { label: "Auth" },
  FORM: { label: "Form" },
  UNKNOWN: { label: "Unknown" },
};
