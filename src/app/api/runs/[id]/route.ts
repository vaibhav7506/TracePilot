import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { runIdSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id } = await params;
  if (!runIdSchema.safeParse(id).success) {
    return apiError("Invalid run ID.", 400);
  }
  try {
    const run = await prisma.qaRun.findFirst({
      where: { id, userId: user.id },
      include: {
        project: { select: { id: true, name: true, baseUrl: true } },
        findings: { orderBy: { createdAt: "asc" } },
        steps: { orderBy: { order: "asc" } },
        generatedTests: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!run) {
      return apiError("Run not found.", 404);
    }
    const { aiAnalysisError: _internalAnalysisError, ...safeRun } = run;
    return apiSuccess(
      { run: safeRun },
      200,
      { "Cache-Control": "private, no-store, max-age=0" },
    );
  } catch (error) {
    console.error(`GET /api/runs/${id} failed:`, error);
    return apiError("Could not load the run.", 500);
  }
}
