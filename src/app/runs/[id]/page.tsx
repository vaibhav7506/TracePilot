import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RunLiveReport } from "@/components/runs/run-live-report";
import type { DemoRun } from "@/lib/placeholder-data";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Run ${id}` };
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function loadRun(
  id: string,
  userId: string,
): Promise<{ run: DemoRun; isDemo: boolean } | null> {
  try {
    const run = await prisma.qaRun.findFirst({
      where: { id, userId },
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
          aiProvider: run.aiProvider,
          aiModel: run.aiModel,
          aiAnalysisStatus: run.aiAnalysisStatus,
          aiAnalysis: run.aiAnalysis,
          generatedTestStatus: run.generatedTestStatus,
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
            fileName: test.fileName,
            framework: test.framework,
            code: test.code,
            provider: test.provider,
            model: test.model,
            generationMode: test.generationMode,
          })),
        },
      };
    }
  } catch (error) {
    console.error(`Run ${id} load failed:`, error);
  }
  return null;
}

export default async function RunDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/runs/${id}`);
  const loaded = await loadRun(id, user.id);
  if (!loaded) notFound();
  return <RunLiveReport initialRun={loaded.run} isDemo={loaded.isDemo} />;
}
