"use client";

import { gsap } from "gsap";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bot,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCode2,
  Gauge,
  ImageIcon,
  ListChecks,
  Network,
  Radio,
  ScanSearch,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GeneratedTestsPanel } from "@/components/runs/generated-tests-panel";
import { RunAgentButton } from "@/components/runs/run-agent-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDuration } from "@/lib/format";
import type { DemoFinding, DemoRun } from "@/lib/placeholder-data";
import { resolveQaHealthScore } from "@/lib/qa-score";
import {
  categoryMeta,
  runStatusMeta,
  severityMeta,
  severityOrder,
  type FindingSeverity,
} from "@/lib/status";
import { cn } from "@/lib/utils";

type ReportTab = "overview" | "trace" | "findings" | "evidence" | "tests";

const tabs: Array<{ id: ReportTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "trace", label: "Browser trace" },
  { id: "findings", label: "Findings" },
  { id: "evidence", label: "Evidence" },
  { id: "tests", label: "Generated tests" },
];

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeRun(value: DemoRun): DemoRun {
  const findings = value.findings.map((finding) => ({
    ...finding,
    reproductionSteps: toStringList(finding.reproductionSteps),
  }));
  const score =
    value.score == null && (value.status === "QUEUED" || value.status === "RUNNING")
      ? null
      : resolveQaHealthScore({
          aiScore: value.score,
          findings,
          runStatus: value.status,
          aiAnalysisStatus: value.aiAnalysisStatus,
        });
  return {
    ...value,
    score,
    steps: value.steps.map((step) => ({
      ...step,
      consoleErrors: toStringList(step.consoleErrors),
      networkErrors: toStringList(step.networkErrors),
    })),
    findings,
  };
}

function analysisView(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const analysis = value as Record<string, unknown>;
  return {
    whatPassed: toStringList(analysis.whatPassed),
    whatFailed: toStringList(analysis.whatFailed),
    mostRiskyIssue: typeof analysis.mostRiskyIssue === "string" ? analysis.mostRiskyIssue : "",
    recommendedNextTest:
      typeof analysis.recommendedNextTest === "string" ? analysis.recommendedNextTest : "",
    recommendedActions: toStringList(analysis.recommendedActions),
  };
}

function detailFromDescription(description: string, label: string): string | null {
  const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][^:\\n]{2,40}:|$)`, "i");
  return description.match(pattern)?.[1]?.trim() || null;
}

function baseDescription(description: string): string {
  return (
    description.split(/\n\n(?:User impact|Root cause hypothesis|Suggested fix direction):/i)[0] ??
    description
  );
}

function samePage(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  try {
    return (
      new URL(left, "https://tracepilot.local").pathname ===
      new URL(right, "https://tracepilot.local").pathname
    );
  } catch {
    return left === right;
  }
}

function StatusBadge({ kind, status }: { kind: "ai" | "tests"; status: string }) {
  const normalized = status.toUpperCase();
  const running = normalized === "RUNNING" || normalized === "GENERATING";
  const failed = normalized === "FAILED";
  const unavailable = normalized === "UNAVAILABLE" || normalized === "NOT_REQUESTED";
  const label = normalized.replaceAll("_", " ").toLowerCase();
  return (
    <Badge
      variant={failed ? "ruby" : running ? "rust" : unavailable ? "muted" : "neutral"}
      dot={running}
    >
      {kind === "ai" ? "AI" : "Tests"} · {label}
    </Badge>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <span className={cn("block h-3 animate-pulse rounded bg-muted", className)} />;
}

export function RunLiveReport({ initialRun, isDemo }: { initialRun: DemoRun; isDemo: boolean }) {
  const [run, setRun] = useState(() => normalizeRun(initialRun));
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [pollError, setPollError] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRun(normalizeRun(initialRun));
  }, [initialRun]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-report-reveal]", {
        y: 14,
        opacity: 0,
        duration: 0.58,
        stagger: 0.055,
        ease: "power3.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      panel,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" },
    );
  }, [activeTab]);

  useEffect(() => {
    if (isDemo || run.status !== "RUNNING") return;
    let disposed = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/runs/${run.id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("poll failed");
        const body = (await response.json()) as { data: { run: DemoRun } };
        if (!disposed) {
          setRun(normalizeRun(body.data.run));
          setLastSynced(new Date());
          setPollError(false);
        }
      } catch {
        if (!disposed) setPollError(true);
      }
    };
    void poll();
    const interval = window.setInterval(() => void poll(), 2500);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [isDemo, run.id, run.status]);

  const meta = runStatusMeta[run.status];
  const analysis = analysisView(run.aiAnalysis);
  const currentStep = run.steps.at(-1) ?? null;
  const durationMs =
    run.status === "COMPLETED" || run.status === "FAILED"
      ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
      : null;
  const counts = useMemo(() => {
    const tally: Record<FindingSeverity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const finding of run.findings) tally[finding.severity] += 1;
    return tally;
  }, [run.findings]);
  const findingsBySeverity = useMemo(
    () =>
      severityOrder
        .map((severity) => ({
          severity,
          findings: run.findings.filter((finding) => finding.severity === severity),
        }))
        .filter((group) => group.findings.length > 0),
    [run.findings],
  );

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div data-report-reveal className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={isDemo ? "/" : "/runs"}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isDemo ? "Back to TracePilot QA" : "All runs"}
        </Link>
        <div className="flex items-center gap-2">
          {run.status === "RUNNING" ? (
            <span className="inline-flex items-center gap-2 font-mono text-[0.68rem] text-muted-foreground">
              <Radio className="h-3.5 w-3.5 animate-pulse text-primary" />
              Live
              {lastSynced
                ? ` · synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : ""}
            </span>
          ) : null}
          {isDemo ? <Badge variant="outline">Recruiter demo</Badge> : null}
        </div>
      </div>

      <section
        data-report-reveal
        className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      >
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-35" aria-hidden />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={meta.variant} dot={meta.dot}>
                {meta.label}
              </Badge>
              <StatusBadge kind="ai" status={run.aiAnalysisStatus} />
              <StatusBadge kind="tests" status={run.generatedTestStatus} />
            </div>
            <p className="eyebrow mt-7">QA run report · {formatDate(run.createdAt)}</p>
            <h1 className="mt-2 max-w-4xl font-display text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">
              {run.project.name}
            </h1>
            <a
              href={run.project.baseUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex max-w-full items-center gap-2 truncate font-mono text-xs text-primary transition-opacity hover:opacity-75"
            >
              {run.project.baseUrl}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
            <div className="mt-6 max-w-3xl border-l-2 border-primary/50 pl-4">
              <p className="eyebrow">Testing goal</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {run.goal}
              </p>
            </div>
          </div>
          <div className="flex items-end gap-6 lg:flex-col lg:items-end">
            <div className="relative grid h-28 w-28 place-items-center rounded-full border border-primary/25 bg-primary/[0.06] shadow-[inset_0_0_0_7px_rgb(var(--background)/0.45)] sm:h-32 sm:w-32">
              <div className="text-center">
                <span className="font-display text-4xl font-semibold tracking-tight">
                  {run.score ?? "—"}
                </span>
                <span className="block font-mono text-[0.62rem] uppercase tracking-eyebrow text-muted-foreground">
                  QA score
                </span>
              </div>
            </div>
            <p className="max-w-44 text-right font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
              Run ID
              <br />
              <span className="break-all text-foreground/70">{run.id}</span>
            </p>
          </div>
        </div>
      </section>

      {run.status === "RUNNING" ? (
        <Card
          data-report-reveal
          className="mt-5 overflow-hidden border-primary/25 bg-primary/[0.035]"
        >
          <div className="h-0.5 w-full overflow-hidden bg-muted">
            <span className="block h-full w-1/3 animate-[progress_1.8s_ease-in-out_infinite] bg-primary" />
          </div>
          <CardContent className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-4 w-4 animate-pulse" />
            </span>
            <div>
              <p className="text-sm font-medium">
                {currentStep
                  ? `Step ${currentStep.order}: ${currentStep.action}`
                  : "Starting browser session"}
              </p>
              <p className="mt-1 truncate font-mono text-[0.7rem] text-muted-foreground">
                {currentStep?.target ?? currentStep?.url ?? "Waiting for the first browser action"}
              </p>
            </div>
            <div className="min-w-36">
              <p className="eyebrow">Completed steps</p>
              <p className="mt-1 font-display text-xl font-semibold">{run.steps.length}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {pollError ? (
        <p className="mt-3 rounded-lg border border-primary/25 bg-primary/[0.05] px-4 py-3 text-xs text-primary">
          Live updates paused. The report will retry automatically.
        </p>
      ) : null}
      {run.status === "FAILED" ? (
        <div
          data-report-reveal
          className="mt-5 flex gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] p-5"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">The browser run did not finish.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Evidence captured before the failure remains available in this report.
            </p>
          </div>
        </div>
      ) : null}
      {!isDemo && run.status === "QUEUED" ? (
        <div
          data-report-reveal
          className="mt-5 flex flex-col gap-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">Ready to begin browser QA</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Launch a non-destructive browser run and watch evidence arrive here.
            </p>
          </div>
          <RunAgentButton
            runId={run.id}
            onStarted={() =>
              setRun((current) => ({
                ...current,
                status: "RUNNING",
                startedAt: new Date().toISOString(),
              }))
            }
          />
        </div>
      ) : null}

      <div data-report-reveal className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Steps", value: run.steps.length, icon: ListChecks },
          { label: "Findings", value: run.findings.length, icon: ScanSearch },
          { label: "Critical", value: counts.CRITICAL, icon: AlertCircle },
          { label: "High", value: counts.HIGH, icon: Gauge },
          { label: "Medium", value: counts.MEDIUM, icon: Activity },
          { label: "Low", value: counts.LOW, icon: CheckCircle2 },
          {
            label: "Captures",
            value: run.steps.filter((step) => step.screenshotPath).length,
            icon: Camera,
          },
          { label: "Duration", value: formatDuration(durationMs), icon: Clock3 },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-subtle"
          >
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
            <p className="mt-4 font-display text-xl font-semibold">{stat.value}</p>
            <p className="eyebrow mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div data-report-reveal className="mt-8 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Report sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 py-3 font-mono text-[0.7rem] uppercase tracking-wider transition-colors",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div ref={panelRef} className="mt-6" role="tabpanel">
        {activeTab === "overview" ? <OverviewPanel run={run} analysis={analysis} /> : null}
        {activeTab === "trace" ? <TracePanel run={run} /> : null}
        {activeTab === "findings" ? <FindingsPanel run={run} groups={findingsBySeverity} /> : null}
        {activeTab === "evidence" ? <EvidencePanel run={run} /> : null}
        {activeTab === "tests" ? (
          <GeneratedTestsPanel
            runId={run.id}
            canGenerate={run.status === "COMPLETED"}
            isDemo={isDemo}
            tests={run.generatedTests}
            generationStatus={run.generatedTestStatus}
          />
        ) : null}
      </div>
    </div>
  );
}

function OverviewPanel({
  run,
  analysis,
}: {
  run: DemoRun;
  analysis: ReturnType<typeof analysisView>;
}) {
  const aiFailed = run.aiAnalysisStatus === "FAILED";
  const aiMissing =
    run.aiAnalysisStatus === "UNAVAILABLE" || run.aiAnalysisStatus === "NOT_REQUESTED";
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_0.85fr]">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Executive QA summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-base leading-7 text-muted-foreground">
              {run.summary ||
                (run.status === "RUNNING"
                  ? "The executive summary will appear after browser exploration and AI analysis complete."
                  : "No run summary is available.")}
            </p>
            {run.status === "RUNNING" && !run.summary ? (
              <div className="mt-5 space-y-2">
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-4/5" />
              </div>
            ) : null}
          </CardContent>
        </Card>
        {aiFailed ? (
          <Card className="border-primary/30 bg-primary/[0.045]">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <AlertCircle className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-foreground">
                    AI analysis failed, but deterministic browser QA completed successfully.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Possible reasons:</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[
                      "Missing API key",
                      "Invalid provider or model",
                      "Provider returned invalid JSON",
                      "Provider request failed",
                    ].map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : analysis ? (
          <div className="grid gap-4 md:grid-cols-2">
            <InsightCard title="What passed" items={analysis.whatPassed} />
            <InsightCard title="What failed" items={analysis.whatFailed} accent />
            <InsightCard title="Highest risk" text={analysis.mostRiskyIssue} accent />
            <InsightCard title="Recommended next test" text={analysis.recommendedNextTest} />
          </div>
        ) : aiMissing ? (
          <EmptyState
            icon={Bot}
            eyebrow="Deterministic report preserved"
            title={run.aiProvider ? "AI analysis unavailable" : "AI provider not configured"}
            description={
              run.aiProvider
                ? "The configured provider did not return analysis. Browser evidence and deterministic findings remain intact."
                : "Add a platform provider key and model to enrich future reports. This run remains fully usable without AI."
            }
          />
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 animate-pulse text-primary" />
                <div>
                  <p className="font-medium">AI analysis is {run.aiAnalysisStatus.toLowerCase()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Evidence is being organized into impact, risk, and recommended actions.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <SkeletonLine />
                <SkeletonLine className="w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis provenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <ProvenanceRow label="Provider" value={run.aiProvider || "Not configured"} />
            <ProvenanceRow label="Model" value={run.aiModel || "Not configured"} />
            <ProvenanceRow label="Analysis" value={run.aiAnalysisStatus.replaceAll("_", " ")} />
            <ProvenanceRow
              label="Test generation"
              value={run.generatedTestStatus.replaceAll("_", " ")}
            />
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/[0.035]">
          <CardHeader>
            <CardTitle className="text-base">Recommended next actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {analysis?.recommendedActions.length ? (
              <ol className="space-y-3">
                {analysis.recommendedActions.map((action, index) => (
                  <li
                    key={action}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-primary/25 font-mono text-[0.65rem] text-primary">
                      {index + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            ) : aiFailed ? (
              <p className="text-sm text-muted-foreground">
                Review the deterministic findings and browser evidence while AI analysis is
                unavailable.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Recommendations will appear when analysis completes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  items,
  text,
  accent = false,
}: {
  title: string;
  items?: string[];
  text?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn("p-5 transition-colors hover:border-primary/20", accent && "border-primary/20")}
    >
      <p className="eyebrow">{title}</p>
      {items ? (
        <ul className="mt-3 space-y-2">
          {items.length ? (
            items.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">Nothing recorded.</li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {text || "Nothing recorded."}
        </p>
      )}
    </Card>
  );
}

function ProvenanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0">
      <span className="eyebrow">{label}</span>
      <span className="max-w-[65%] truncate font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}

function TracePanel({ run }: { run: DemoRun }) {
  if (!run.steps.length)
    return (
      <EmptyState
        icon={ListChecks}
        eyebrow="Browser trace"
        title="No browser steps"
        description="The timeline will populate as soon as the runner performs its first action."
      />
    );
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="text-base">Timeline of browser actions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ol>
          {run.steps.map((step, index) => {
            const consoleErrors = step.consoleErrors;
            const networkErrors = step.networkErrors;
            return (
              <li
                key={step.id}
                className="group grid grid-cols-[auto_1fr] gap-4 border-b border-border/70 px-5 py-5 last:border-0 sm:grid-cols-[3rem_1fr_auto] sm:px-6"
              >
                <div className="relative">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full border font-mono text-[0.68rem]",
                      step.result === "failed"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {String(step.order).padStart(2, "0")}
                  </span>
                  {index < run.steps.length - 1 ? (
                    <span className="absolute left-[1.1rem] top-10 h-[calc(100%+0.5rem)] w-px bg-border" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs uppercase text-foreground">
                      {step.action}
                    </span>
                    {step.result ? (
                      <Badge variant={step.result === "failed" ? "ruby" : "muted"}>
                        {step.result}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    {step.target || step.url || "Browser action"}
                  </p>
                  <p className="mt-1 truncate font-mono text-[0.68rem] text-muted-foreground/70">
                    {step.url}
                  </p>
                  {consoleErrors.length || networkErrors.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {consoleErrors.length ? (
                        <SignalChip
                          icon={SquareTerminal}
                          label={`${consoleErrors.length} console signal${consoleErrors.length === 1 ? "" : "s"}`}
                        />
                      ) : null}
                      {networkErrors.length ? (
                        <SignalChip
                          icon={Network}
                          label={`${networkErrors.length} network signal${networkErrors.length === 1 ? "" : "s"}`}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="col-start-2 flex items-center gap-2 sm:col-auto">
                  {step.screenshotPath ? (
                    <Badge variant="outline">
                      <Camera className="h-3 w-3" />
                      Evidence
                    </Badge>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function SignalChip({ icon: Icon, label }: { icon: typeof Network; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/15 bg-primary/[0.045] px-2 py-1 font-mono text-[0.65rem] text-primary">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function FindingsPanel({
  run,
  groups,
}: {
  run: DemoRun;
  groups: Array<{ severity: FindingSeverity; findings: DemoFinding[] }>;
}) {
  if (!run.findings.length)
    return (
      <EmptyState
        icon={CheckCircle2}
        eyebrow="Clean deterministic pass"
        title="No findings detected"
        description="No console, network, route, or user-flow issues were captured during this run."
      />
    );
  return (
    <div className="space-y-8">
      {groups.map(({ severity, findings }) => (
        <section key={severity}>
          <div className="mb-3 flex items-center gap-3">
            <Badge variant={severityMeta[severity].variant}>{severityMeta[severity].label}</Badge>
            <span className="font-mono text-xs text-muted-foreground">
              {findings.length} finding{findings.length === 1 ? "" : "s"}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} run={run} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FindingCard({ finding, run }: { finding: DemoFinding; run: DemoRun }) {
  const impact = detailFromDescription(finding.description, "User impact");
  const fix = detailFromDescription(finding.description, "Suggested fix direction");
  const related = run.steps.filter((step) => samePage(step.url, finding.url));
  const consoleSignals = related.flatMap((step) => step.consoleErrors).slice(0, 2);
  const networkSignals = related.flatMap((step) => step.networkErrors).slice(0, 2);
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card">
      <div
        className="h-1 bg-primary"
        style={{
          opacity:
            finding.severity === "CRITICAL"
              ? 1
              : finding.severity === "HIGH"
                ? 0.72
                : finding.severity === "MEDIUM"
                  ? 0.48
                  : 0.25,
        }}
      />
      <CardHeader className="border-b border-border/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Badge variant={severityMeta[finding.severity].variant}>{finding.severity}</Badge>
            <Badge variant="outline">{categoryMeta[finding.category].label}</Badge>
          </div>
          {run.generatedTests.length && ["CRITICAL", "HIGH"].includes(finding.severity) ? (
            <Badge variant="neutral">
              <FileCode2 className="h-3 w-3" />
              Generated regression test
            </Badge>
          ) : null}
        </div>
        <CardTitle className="mt-3 text-lg">{finding.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <ReportDetail
          label="Risk level"
          text={`${finding.severity} · ${finding.category.toLowerCase()} impact`}
        />
        <ReportDetail label="User impact" text={impact || baseDescription(finding.description)} />
        <ReportDetail label="Reproduction steps" list={finding.reproductionSteps} />
        {consoleSignals.length ? (
          <ReportDetail label="Console signal" list={consoleSignals} mono />
        ) : null}
        {networkSignals.length ? (
          <ReportDetail label="Network signal" list={networkSignals} mono />
        ) : null}
        <ReportDetail
          label="Evidence"
          text={
            finding.screenshotPath
              ? `Screenshot captured · ${finding.url || "affected route"}`
              : finding.url || "Deterministic runner observation"
          }
        />
        {fix ? <ReportDetail label="Suggested fix direction" text={fix} /> : null}
      </CardContent>
    </Card>
  );
}

function ReportDetail({
  label,
  text,
  list,
  mono = false,
}: {
  label: string;
  text?: string;
  list?: string[];
  mono?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      {list ? (
        <ol
          className={cn(
            "mt-2 space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground",
            label === "Reproduction steps" && "list-decimal",
            mono && "font-mono text-xs",
          )}
        >
          {list.length ? list.map((item) => <li key={item}>{item}</li>) : <li>Not recorded.</li>}
        </ol>
      ) : (
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed text-muted-foreground",
            mono && "font-mono text-xs",
          )}
        >
          {text || "Not recorded."}
        </p>
      )}
    </div>
  );
}

function EvidencePanel({ run }: { run: DemoRun }) {
  const captures = run.steps.filter((step) => step.screenshotPath);
  if (!captures.length)
    return (
      <EmptyState
        icon={ImageIcon}
        eyebrow="Visual evidence"
        title="No screenshots captured"
        description="Screenshot evidence will appear here when browser steps complete successfully."
      />
    );
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Visual evidence</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Screenshots</h2>
        </div>
        <Badge variant="outline">{captures.length} captures</Badge>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {captures.map((step) => {
          const served = step.screenshotPath?.startsWith("/screenshots/");
          return (
            <li
              key={step.id}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/25"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
                {served ? (
                  // Captures have runtime dimensions and are served directly from the local evidence store.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={step.screenshotPath ?? ""}
                    alt={`Evidence captured at step ${step.order}`}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.015]"
                  />
                ) : (
                  <>
                    <div className="grid-lines absolute inset-0 opacity-50" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center text-muted-foreground">
                        <Camera className="mx-auto h-6 w-6" />
                        <p className="mt-2 font-mono text-[0.65rem]">Screenshot placeholder</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[0.68rem] uppercase text-foreground">
                    Step {step.order} · {step.action}
                  </span>
                  <Badge variant="muted">Evidence</Badge>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {step.url || step.target}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
