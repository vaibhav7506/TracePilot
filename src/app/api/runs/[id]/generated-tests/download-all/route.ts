import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createZip } from "@/lib/test-generation/zip";
import { runIdSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api-response";
import { uniqueSafeSpecFileNames } from "@/lib/test-generation/file-name";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id } = await params;
  if (!runIdSchema.safeParse(id).success) {
    return apiError("Invalid run ID.", 400);
  }
  try {
    const tests = await prisma.generatedTest.findMany({
      where: { runId: id, run: { userId: user.id } },
      orderBy: { createdAt: "asc" },
      select: { fileName: true, code: true },
    });
    if (tests.length === 0) {
      return apiError("No generated tests found.", 404);
    }
    const fileNames = uniqueSafeSpecFileNames(tests.map((test) => test.fileName));
    const zip = createZip(
      tests.map((test, index) => ({
        name: fileNames[index] ?? `generated-${index + 1}.spec.ts`,
        data: test.code,
      })),
    );
    return new NextResponse(new Blob([zip], { type: "application/zip" }), {
      headers: {
        "Content-Disposition": `attachment; filename="tracepilot-${id}-tests.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return apiError("Could not prepare the generated test archive.", 500);
  }
}
