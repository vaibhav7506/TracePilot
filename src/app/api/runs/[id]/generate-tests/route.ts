import { apiError, apiSuccess } from "@/lib/api-response";
import { generateRunTests } from "@/lib/test-generation/generate-run-tests";
import { prisma } from "@/lib/prisma";
import { runIdSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id } = await params;
  if (!runIdSchema.safeParse(id).success) {
    return apiError("Invalid run ID.", 400);
  }
  try {
    const owned = await prisma.qaRun.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) return apiError("Run not found.", 404);
    const result = await generateRunTests(id);
    if (result.kind === "not-found") {
      return apiError("Run not found.", 404);
    }
    if (result.kind === "not-completed") {
      return apiError("Tests can only be generated for a completed run.", 409);
    }
    return apiSuccess(result);
  } catch {
    await prisma.qaRun
      .update({ where: { id }, data: { generatedTestStatus: "FAILED" } })
      .catch(() => null);
    return apiError("Could not generate tests.", 500);
  }
}
