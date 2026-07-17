import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createProjectSchema, fieldErrors } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { runs: true } } },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects failed:", error);
    return NextResponse.json({ error: "Could not load projects." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.create({ data: parsed.data });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects failed:", error);
    return NextResponse.json({ error: "Could not create the project." }, { status: 500 });
  }
}
