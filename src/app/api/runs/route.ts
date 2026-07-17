import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRunSchema, fieldErrors } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runs = await prisma.qaRun.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true, baseUrl: true } },
        findings: { select: { severity: true } },
        _count: { select: { steps: true, generatedTests: true } },
      },
    });
    return NextResponse.json({ runs });
  } catch (error) {
    console.error("GET /api/runs failed:", error);
    return NextResponse.json({ error: "Could not load runs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = createRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  // SECURITY: loginUrl / loginEmail / loginPassword are validated above but
  // intentionally NOT written to the database. They exist only in this request
  // scope; the agent phase will consume them from the queued-run handoff.
  // TODO(secure-storage): replace with encrypted secret storage (KMS/vault)
  // before the agent persists any credential material.
  const { projectId, goal } = parsed.data;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: "Check the highlighted fields.", fields: { projectId: "Project not found." } },
        { status: 404 },
      );
    }

    const run = await prisma.qaRun.create({
      data: { projectId, goal, status: "QUEUED" },
      include: { project: { select: { id: true, name: true, baseUrl: true } } },
    });
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    console.error("POST /api/runs failed:", error);
    return NextResponse.json({ error: "Could not create the run." }, { status: 500 });
  }
}
