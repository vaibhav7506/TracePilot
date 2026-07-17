import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const run = await prisma.qaRun.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, baseUrl: true } },
        findings: { orderBy: { createdAt: "asc" } },
        steps: { orderBy: { order: "asc" } },
        generatedTests: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found." }, { status: 404 });
    }
    return NextResponse.json({ run });
  } catch (error) {
    console.error(`GET /api/runs/${params.id} failed:`, error);
    return NextResponse.json({ error: "Could not load the run." }, { status: 500 });
  }
}
