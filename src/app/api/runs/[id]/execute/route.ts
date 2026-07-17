import { NextResponse, type NextRequest } from "next/server";
import { executeRun } from "@/lib/runner/browser-runner";
import { prisma } from "@/lib/prisma";
import { executeRunSchema, fieldErrors } from "@/lib/validations";

/**
 * POST /api/runs/[id]/execute — launch the deterministic Playwright runner for
 * a queued run.
 *
 * ── RUNTIME ─────────────────────────────────────────────────────────────────
 * This handler runs Playwright (a real Chromium process) and can take up to
 * ~90s. It therefore requires the Node.js runtime and a generous timeout. In
 * production it should be dispatched to a background worker/queue rather than
 * executed inline in a request; a short-timeout serverless function will kill
 * the browser mid-run. Inline execution here is for local development.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Best-effort hint for platforms that honor it (e.g. Vercel). Local Node
// servers ignore this and run to completion.
export const maxDuration = 120;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const runId = params.id;

  // Body is optional; tolerate an empty request.
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = executeRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the login fields.", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const run = await prisma.qaRun
    .findUnique({
      where: { id: runId },
      include: { project: { select: { baseUrl: true } } },
    })
    .catch((error: unknown) => {
      console.error(`Execute lookup failed for ${runId}:`, error);
      return null;
    });

  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }
  // Only queued runs may execute — prevents duplicate steps (unique runId+order)
  // and concurrent executions of the same run.
  if (run.status !== "QUEUED") {
    return NextResponse.json(
      { error: `This run is ${run.status.toLowerCase()} and cannot be executed again.` },
      { status: 409 },
    );
  }

  // Credentials live only in this request scope. They are handed to the runner
  // in memory and never persisted or logged.
  const summary = await executeRun({
    runId: run.id,
    baseUrl: run.project.baseUrl,
    goal: run.goal,
    credentials: {
      loginUrl: parsed.data.loginUrl,
      email: parsed.data.loginEmail,
      password: parsed.data.loginPassword,
    },
  });

  const httpStatus = summary.status === "FAILED" ? 500 : 200;
  return NextResponse.json({ summary }, { status: httpStatus });
}
