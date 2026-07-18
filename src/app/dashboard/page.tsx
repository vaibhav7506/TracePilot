import { BrainCircuit, FolderPlus, Radar } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProjectForm } from "@/components/dashboard/project-form";
import { RunForm, type ProjectOption } from "@/components/dashboard/run-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section, SectionHeader } from "@/components/ui/section";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { runStatusMeta, type RunStatus } from "@/lib/status";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserAiAvailability, type UserAiAvailability } from "@/lib/ai/resolve-user-provider";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Create projects and queue autonomous QA runs.",
};

export const dynamic = "force-dynamic";

type RecentRun = {
  id: string;
  goal: string;
  status: RunStatus;
  createdAt: Date;
  projectName: string;
};

async function loadData(userId: string): Promise<{
  projects: ProjectOption[];
  recentRuns: RecentRun[];
  ai: UserAiAvailability;
  dbError: boolean;
}> {
  try {
    const [projects, runs, ai] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, baseUrl: true },
      }),
      prisma.qaRun.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { project: { select: { name: true } } },
      }),
      getUserAiAvailability(userId),
    ]);
    return {
      projects,
      recentRuns: runs.map((run) => ({
        id: run.id,
        goal: run.goal,
        status: run.status,
        createdAt: run.createdAt,
        projectName: run.project.name,
      })),
      ai,
      dbError: false,
    };
  } catch (error) {
    console.error("Dashboard data load failed:", error);
    return {
      projects: [],
      recentRuns: [],
      ai: { kind: "unavailable", provider: null, model: null },
      dbError: true,
    };
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const { projects, recentRuns, ai, dbError } = await loadData(user.id);

  return (
    <Section spacing="md">
      <SectionHeader
        eyebrow="Dashboard"
        title="Projects & runs"
        description="Register a site, describe the user journey that matters, and let the browser agent turn its trace into an actionable QA report."
      />

      {dbError ? (
        <p className="mt-6 rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-foreground">
          The database is unreachable. Check <code className="font-mono text-xs">DATABASE_URL</code>{" "}
          in <code className="font-mono text-xs">.env</code> and run{" "}
          <code className="font-mono text-xs">npm run prisma:migrate</code>, then reload.
        </p>
      ) : null}

      <Card className="mt-6 bg-card/65">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-md border border-primary/25 bg-primary/10 p-2 text-primary">
              <BrainCircuit className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {ai.kind === "byok"
                  ? "BYOK AI active"
                  : ai.kind === "platform"
                    ? "Platform AI active"
                    : "AI unavailable"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {ai.kind === "unavailable"
                  ? "Browser execution and deterministic test generation remain available without AI."
                  : `${ai.provider} / ${ai.model} will enrich findings and generated tests.`}
              </p>
            </div>
          </div>
          <Link
            href="/settings/providers"
            className="font-mono text-xs text-primary transition-colors hover:text-primary/75"
          >
            Manage providers →
          </Link>
        </CardContent>
      </Card>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Start a QA run</CardTitle>
            <CardDescription>
              Choose a project and a focused goal. TracePilot opens Chromium, records evidence, and
              keeps destructive actions blocked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RunForm projects={projects} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New project</CardTitle>
              <CardDescription>The website a run will be executed against.</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 && !dbError ? (
                <p className="mb-5 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                  <FolderPlus className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  Create your first project to enable runs.
                </p>
              ) : null}
              <ProjectForm />
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Recent runs</CardTitle>
              <Link
                href="/runs"
                className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all →
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {recentRuns.length === 0 ? (
                <EmptyState
                  icon={Radar}
                  title="No runs yet"
                  description="Queue your first run and it will appear here."
                  className="py-10"
                />
              ) : (
                <ul className="flex flex-col gap-1">
                  {recentRuns.map((run) => {
                    const meta = runStatusMeta[run.status];
                    return (
                      <li key={run.id}>
                        <Link
                          href={`/runs/${run.id}`}
                          className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {run.projectName}
                            </p>
                            <p className="truncate font-mono text-[0.7rem] text-muted-foreground">
                              {formatDate(run.createdAt.toISOString())} · {run.goal}
                            </p>
                          </div>
                          <Badge variant={meta.variant} dot={meta.dot}>
                            {meta.label}
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Section>
  );
}
