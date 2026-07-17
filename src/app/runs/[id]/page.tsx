import { ArrowLeft, Camera, FileCode2, ListChecks, ScanSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RunAgentButton } from "@/components/runs/run-agent-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { formatDate, formatDuration } from "@/lib/format";
import { DEMO_RUN_ID, demoRun, type DemoRun } from "@/lib/placeholder-data";
import { prisma } from "@/lib/prisma";
import { categoryMeta, runStatusMeta, severityMeta } from "@/lib/status";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export function generateMetadata({ params }: PageProps): Metadata {
  return { title: `Run ${params.id}` };
}

/** True when a screenshot path is a real web-served capture (not a demo stub). */
function isServedScreenshot(path: string | null): path is string {
  return typeof path === "string" && path.startsWith("/screenshots/");
}

/** Coerce a Prisma Json column into a string list for display. */
function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function loadRun(id: string): Promise<{ run: DemoRun; isDemo: boolean } | null> {
  try {
    const run = await prisma.qaRun.findUnique({
      where: { id },
      include: {
        project: { select: { name: true, baseUrl: true } },
        findings: { orderBy: { createdAt: "asc" } },
        steps: { orderBy: { order: "asc" } },
        generatedTests: { orderBy: { createdAt: "asc" } },
      },
    });
    if (run) {
      return {
        isDemo: false,
        run: {
          id: run.id,
          status: run.status,
          goal: run.goal,
          summary: run.summary,
          score: run.score,
          startedAt: run.startedAt?.toISOString() ?? run.createdAt.toISOString(),
          finishedAt: run.finishedAt?.toISOString() ?? run.createdAt.toISOString(),
          createdAt: run.createdAt.toISOString(),
          project: run.project,
          steps: run.steps.map((step) => ({
            id: step.id,
            order: step.order,
            action: step.action,
            target: step.target,
            url: step.url,
            result: step.result,
            screenshotPath: step.screenshotPath,
            consoleErrors: toStringList(step.consoleErrors),
            networkErrors: toStringList(step.networkErrors),
          })),
          findings: run.findings.map((finding) => ({
            id: finding.id,
            title: finding.title,
            description: finding.description,
            severity: finding.severity,
            category: finding.category,
            url: finding.url,
            selector: finding.selector,
            screenshotPath: finding.screenshotPath,
            reproductionSteps: toStringList(finding.reproductionSteps),
          })),
          generatedTests: run.generatedTests.map((test) => ({
            id: test.id,
            title: test.title,
            framework: test.framework,
            code: test.code,
          })),
        },
      };
    }
  } catch (error) {
    console.error(`Run ${id} load failed:`, error);
  }
  // The landing page's demo report works without any database rows.
  if (id === DEMO_RUN_ID) return { run: demoRun, isDemo: true };
  return null;
}

export default async function RunDetailPage({ params }: PageProps) {
  const loaded = await loadRun(params.id);
  if (!loaded) notFound();
  const { run, isDemo } = loaded;

  const meta = runStatusMeta[run.status];
  const durationMs =
    run.status === "COMPLETED" || run.status === "FAILED"
      ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
      : null;

  return (
    <Section spacing="md">
      <div className="flex items-center justify-between">
        <Link
          href="/runs"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All runs
        </Link>
        {isDemo ? <Badge variant="outline">Sample report</Badge> : null}
      </div>

      {/* Run header */}
      <div className="mt-4 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {run.project.name}
            </h1>
            <Badge variant={meta.variant} dot={meta.dot}>
              {meta.label}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{run.goal}</p>
          <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground/70">
            {run.id} · {run.project.baseUrl.replace(/^https?:\/\//, "")} ·{" "}
            {formatDate(run.createdAt)}
          </p>
        </div>
        <dl className="grid grid-cols-4 gap-5 md:shrink-0">
          {[
            { k: "Steps", v: String(run.steps.length) },
            { k: "Findings", v: String(run.findings.length) },
            { k: "Score", v: run.score == null ? "—" : `${run.score}` },
            { k: "Duration", v: formatDuration(durationMs) },
          ].map((stat) => (
            <div key={stat.k} className="text-right">
              <dt className="eyebrow">{stat.k}</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{stat.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Agent action bar */}
      {!isDemo && run.status === "QUEUED" ? (
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-primary/25 bg-primary/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">This run is queued.</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Launch the deterministic agent to explore the site and capture findings. No AI runs in
              this phase — exploration is rule-based.
            </p>
          </div>
          <RunAgentButton runId={run.id} />
        </div>
      ) : null}

      {!isDemo && run.status === "RUNNING" ? (
        <p className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-xs text-muted-foreground">
          The agent is currently executing this run. Reload to see the latest steps and findings.
        </p>
      ) : null}

      {/* Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {run.summary ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {run.summary}
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              {run.status === "QUEUED"
                ? "Waiting for the agent — a summary is written when the run finishes."
                : "No summary recorded for this run."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-8">
          {/* Browser steps timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browser steps</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {run.steps.length === 0 ? (
                <EmptyState
                  icon={ListChecks}
                  title="No steps recorded"
                  description="The trace appears here once the agent starts executing this run."
                  className="py-10"
                />
              ) : (
                <ol className="relative flex flex-col">
                  {run.steps.map((step, i) => {
                    const failed = step.result === "failed";
                    const skipped = step.result === "skipped";
                    const last = i === run.steps.length - 1;
                    return (
                      <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
                        {!last ? (
                          <span
                            className="absolute left-[0.55rem] top-5 h-full w-px bg-border"
                            aria-hidden
                          />
                        ) : null}
                        <span
                          className={
                            "relative mt-1 h-[1.1rem] w-[1.1rem] shrink-0 rounded-full border-2 " +
                            (failed
                              ? "border-primary bg-primary/20"
                              : skipped
                                ? "border-border bg-muted"
                                : "border-foreground/40 bg-background")
                          }
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-medium text-foreground">
                              <span className="font-mono text-xs uppercase text-muted-foreground">
                                {step.action}
                              </span>{" "}
                              {step.target ?? step.url ?? ""}
                            </p>
                            <span
                              className={
                                "font-mono text-[0.68rem] uppercase tracking-wider " +
                                (failed ? "text-primary" : "text-muted-foreground")
                              }
                            >
                              {step.result ?? "pending"}
                            </span>
                          </div>
                          <p className="mt-0.5 font-mono text-[0.7rem] text-muted-foreground">
                            step {step.order}
                            {step.url ? ` · ${step.url}` : ""}
                          </p>
                          {step.consoleErrors.map((line) => (
                            <p key={line} className="mt-1 truncate font-mono text-[0.7rem] text-primary">
                              console: {line}
                            </p>
                          ))}
                          {step.networkErrors.map((line) => (
                            <p key={line} className="mt-1 truncate font-mono text-[0.7rem] text-wine dark:text-soft-red">
                              network: {line}
                            </p>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Generated tests */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Generated tests</CardTitle>
              {run.generatedTests.length > 0 ? (
                <Badge variant="outline">
                  <FileCode2 className="h-3 w-3" aria-hidden />
                  {run.generatedTests[0]?.framework ?? "playwright"}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              {run.generatedTests.length === 0 ? (
                <EmptyState
                  icon={FileCode2}
                  title="No tests generated"
                  description="Verified flows are exported as Playwright tests when the run completes."
                  className="py-10"
                />
              ) : (
                run.generatedTests.map((test) => (
                  <div key={test.id} className="overflow-hidden rounded-md border border-border bg-muted/30">
                    <div className="border-b border-border px-4 py-2 font-mono text-[0.7rem] text-muted-foreground">
                      {test.title}
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                      <code>{test.code}</code>
                    </pre>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-8">
          {/* Findings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Findings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {run.findings.length === 0 ? (
                <EmptyState
                  icon={ScanSearch}
                  title="No findings"
                  description="Problems the agent detects — console errors, failed requests, broken routes — are listed here."
                  className="py-10"
                />
              ) : (
                run.findings.map((finding) => {
                  const sev = severityMeta[finding.severity];
                  return (
                    <div key={finding.id} className="rounded-md border border-border bg-background/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={sev.variant}>{sev.label}</Badge>
                          <Badge variant="outline">{categoryMeta[finding.category].label}</Badge>
                        </div>
                        {finding.url ? (
                          <span className="truncate font-mono text-[0.7rem] text-muted-foreground">
                            {finding.url.replace(/^https?:\/\/[^/]+/, "") || "/"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2.5 text-sm font-medium text-foreground">{finding.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {finding.description}
                      </p>
                      {finding.selector ? (
                        <p className="mt-2 truncate font-mono text-[0.7rem] text-muted-foreground">
                          {finding.selector}
                        </p>
                      ) : null}
                      {finding.reproductionSteps.length > 0 ? (
                        <details className="mt-3">
                          <summary className="cursor-pointer font-mono text-[0.7rem] uppercase tracking-eyebrow text-muted-foreground transition-colors hover:text-foreground">
                            Reproduction steps
                          </summary>
                          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
                            {finding.reproductionSteps.map((repro) => (
                              <li key={repro}>{repro}</li>
                            ))}
                          </ol>
                        </details>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Screenshots */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Screenshots</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {run.steps.some((step) => step.screenshotPath) ? (
                <ul className="grid grid-cols-2 gap-3">
                  {run.steps
                    .filter((step) => step.screenshotPath)
                    .map((step) => (
                      <li
                        key={step.id}
                        className="relative aspect-[16/10] overflow-hidden rounded-md border border-border bg-muted/30"
                      >
                        {isServedScreenshot(step.screenshotPath) ? (
                          // Real capture served from /public/screenshots. Plain
                          // <img> (not next/image) — dimensions are unknown and
                          // these are local, ungoverned assets.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={step.screenshotPath ?? ""}
                            alt={`Screenshot at step ${step.order}`}
                            loading="lazy"
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <>
                            <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                              <Camera className="h-5 w-5" aria-hidden />
                            </div>
                          </>
                        )}
                        <span className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[0.6rem] text-muted-foreground">
                          step {String(step.order).padStart(2, "0")}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Camera}
                  title="No captures yet"
                  description="Per-step screenshots appear here once the agent has executed this run."
                  className="py-10"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}
