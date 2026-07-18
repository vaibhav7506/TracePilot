import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runIdSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api-response";
import { safeSpecFileName } from "@/lib/test-generation/file-name";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; testId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id, testId } = await params;
  if (!runIdSchema.safeParse(id).success || !runIdSchema.safeParse(testId).success) {
    return apiError("Invalid generated test identifier.", 400);
  }
  try {
    const generatedTest = await prisma.generatedTest.findFirst({
      where: { id: testId, runId: id, run: { userId: user.id } },
      select: { fileName: true, code: true },
    });
    if (!generatedTest) return apiError("Generated test not found.", 404);
    return new NextResponse(generatedTest.code, {
      headers: {
        "Content-Type": "text/typescript; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeSpecFileName(generatedTest.fileName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return apiError("Could not prepare the generated test download.", 500);
  }
}
