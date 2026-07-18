import { Radar } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SeedDemoButton } from "@/components/runs/seed-demo-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatDate, formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { runStatusMeta, severityMeta, severityOrder, type FindingSeverity } from "@/lib/status";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Runs",
  description: "Every QA run TracePilot has executed.",
};

export const dynamic = "force-dynamic";

async function loadRuns(userId: string) {
  try {
    return await prisma.qaRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true, baseUrl: true } },
        findings: { select: { severity: true } },
        _count: { select: { steps: true } },
      },
    });
  } catch (error) {
    console.error("Runs list load failed:", error);
    return [];
  }
}

function severityCounts(findings: { severity: FindingSeverity }[]) {
  const counts = new Map<FindingSeverity, number>();
  for (const finding of findings) {
    counts.set(finding.severity, (counts.get(finding.severity) ?? 0) + 1);
  }
  return severityOrder
    .map((severity) => ({ severity, count: counts.get(severity) ?? 0 }))
    .filter((entry) => entry.count > 0);
}

export default async function RunsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/runs");
  const runs = await loadRuns(user.id);

  return (
    <Section spacing="md">
      <SectionHeader
        eyebrow="History"
        title="Runs"
        description="Each run is one autonomous session against a project. Open any run for its steps, findings, and generated tests."
        actions={
          <div className="flex flex-wrap items-start gap-2">
            <Button variant="outline" asChild>
              <Link href="/demo/report">Open demo report</Link>
            </Button>
            <SeedDemoButton />
          </div>
        }
      />

      {runs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Radar}
            eyebrow="Nothing here yet"
            title="No runs to show"
            description="Create a project and queue a run from the dashboard — it will appear here immediately."
            action={
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <Card className="mt-8 overflow-hidden">
          <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-3 font-mono text-[0.7rem] uppercase tracking-eyebrow text-muted-foreground md:grid">
            <span>Project &amp; goal</span>
            <span className="w-28 text-right">Status</span>
            <span className="w-40 text-right">Findings</span>
            <span className="w-20 text-right">Duration</span>
            <span className="w-28 text-right">Created</span>
          </div>

          <ul className="divide-y divide-border">
            {runs.map((run) => {
              const meta = runStatusMeta[run.status];
              const severities = severityCounts(run.findings);
              const durationMs =
                run.startedAt && run.finishedAt
                  ? run.finishedAt.getTime() - run.startedAt.getTime()
                  : null;
              return (
                <li key={run.id}>
                  <Link
                    href={`/runs/${run.id}`}
                    className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-accent md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {run.project.name}
                        </span>
                        <span className="truncate font-mono text-[0.7rem] text-muted-foreground/70">
                          {run.project.baseUrl.replace(/^https?:\/\//, "")}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{run.goal}</p>
                      <span className="font-mono text-[0.7rem] text-muted-foreground/70">
                        {run.id} · {run._count.steps} steps
                      </span>
                    </div>

                    <div className="md:w-28 md:text-right">
                      <Badge variant={meta.variant} dot={meta.dot}>
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 md:w-40 md:justify-end">
                      {severities.length === 0 ? (
                        <span className="font-mono text-xs text-muted-foreground">—</span>
                      ) : (
                        severities.map(({ severity, count }) => {
                          const sev = severityMeta[severity];
                          return (
                            <Badge key={severity} variant={sev.variant}>
                              {count} {sev.label}
                            </Badge>
                          );
                        })
                      )}
                    </div>

                    <span className="font-mono text-sm text-muted-foreground md:w-20 md:text-right">
                      {formatDuration(durationMs)}
                    </span>
                    <span className="font-mono text-[0.7rem] text-muted-foreground md:w-28 md:text-right">
                      {formatDate(run.createdAt.toISOString())}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </Section>
  );
}
