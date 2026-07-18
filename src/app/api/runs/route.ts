import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { createRunSchema, fieldErrors } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  try {
    const runs = await prisma.qaRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true, baseUrl: true } },
        findings: { select: { severity: true } },
        _count: { select: { steps: true, generatedTests: true } },
      },
    });
    const safeRuns = runs.map(({ aiAnalysisError: _internalAnalysisError, ...run }) => run);
    return apiSuccess({ runs: safeRuns });
  } catch (error) {
    console.error("GET /api/runs failed:", error);
    return apiError("Could not load runs.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be JSON.", 400);
  }

  const parsed = createRunSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Check the highlighted fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  }

  const { projectId, goal } = parsed.data;

  try {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) {
      return apiError("Check the highlighted fields.", 404, {
        fields: { projectId: "Project not found." },
      });
    }

    const run = await prisma.qaRun.create({
      data: { projectId, userId: user.id, goal, status: "QUEUED" },
      include: { project: { select: { id: true, name: true, baseUrl: true } } },
    });
    const { aiAnalysisError: _internalAnalysisError, ...safeRun } = run;
    return apiSuccess({ run: safeRun }, 201);
  } catch (error) {
    console.error("POST /api/runs failed:", error);
    return apiError("Could not create the run.", 500);
  }
}
