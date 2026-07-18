import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { createProjectSchema, fieldErrors } from "@/lib/validations";
import { targetUrlSchema } from "@/lib/runner/url-utils";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { runs: true } } },
    });
    return apiSuccess({ projects });
  } catch (error) {
    console.error("GET /api/projects failed:", error);
    return apiError("Could not load projects.", 500);
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

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Check the highlighted fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  }

  const safeUrl = targetUrlSchema().safeParse(parsed.data.baseUrl);
  if (!safeUrl.success) {
    return apiError("Check the highlighted fields.", 400, {
      fields: { baseUrl: safeUrl.error.issues[0]?.message ?? "Target URL is not allowed." },
    });
  }

  try {
    const project = await prisma.project.create({
      data: { ...parsed.data, baseUrl: safeUrl.data, userId: user.id },
    });
    return apiSuccess({ project }, 201);
  } catch (error) {
    console.error("POST /api/projects failed:", error);
    return apiError("Could not create the project.", 500);
  }
}
