import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { executeRun } from "@/lib/runner/browser-runner";
import { prisma } from "@/lib/prisma";
import { executeRunSchema, fieldErrors, runIdSchema } from "@/lib/validations";
import { sameHostname, targetUrlSchema } from "@/lib/runner/url-utils";
import { generateRunTests } from "@/lib/test-generation/generate-run-tests";
import { getCurrentUser } from "@/lib/auth/current-user";
import { assertPubliclyResolvedUrl } from "@/lib/runner/network-guard";
import { RUNNER_CONFIG } from "@/lib/runner/safety";

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
export const maxDuration = 180;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const { id: runId } = await params;
  if (!runIdSchema.safeParse(runId).success) {
    return apiError("Invalid run ID.", 400);
  }

  // Body is optional; tolerate an empty request.
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return apiError("Request body must be JSON.", 400);
  }

  const parsed = executeRunSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Check the login fields.", 400, {
      fields: fieldErrors(parsed.error),
    });
  }

  const run = await prisma.qaRun
    .findFirst({
      where: { id: runId, userId: user.id },
      include: { project: { select: { baseUrl: true } } },
    })
    .catch((error: unknown) => {
      console.error(`Execute lookup failed for ${runId}:`, error);
      return null;
    });

  if (!run) {
    return apiError("Run not found.", 404);
  }
  // Only queued runs may execute — prevents duplicate steps (unique runId+order)
  // and concurrent executions of the same run.
  if (run.status !== "QUEUED") {
    return apiError(`This run is ${run.status.toLowerCase()} and cannot be executed again.`, 409);
  }

  const safeBaseUrl = targetUrlSchema().safeParse(run.project.baseUrl);
  if (!safeBaseUrl.success) {
    return apiError(
      safeBaseUrl.error.issues[0]?.message ?? "The project target URL is not allowed.",
      400,
    );
  }
  if (parsed.data.loginUrl) {
    const safeLoginUrl = targetUrlSchema().safeParse(parsed.data.loginUrl);
    if (!safeLoginUrl.success || !sameHostname(parsed.data.loginUrl, safeBaseUrl.data)) {
      return apiError("Login URL must be an allowed URL on the same hostname as the project.", 400);
    }
  }

  try {
    await assertPubliclyResolvedUrl(safeBaseUrl.data, RUNNER_CONFIG.allowPrivateNetwork);
    if (parsed.data.loginUrl) {
      await assertPubliclyResolvedUrl(parsed.data.loginUrl, RUNNER_CONFIG.allowPrivateNetwork);
    }
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "The target hostname is not allowed.", 400);
  }

  // Claim the queued run atomically so concurrent requests cannot create
  // duplicate BrowserStep rows for the same run/order pair.
  let claimed;
  try {
    claimed = await prisma.qaRun.updateMany({
      where: { id: run.id, userId: user.id, status: "QUEUED" },
      data: { status: "RUNNING", startedAt: new Date() },
    });
  } catch {
    return apiError("The run could not be started because the database is unavailable.", 503);
  }
  if (claimed.count !== 1) {
    return apiError("This run has already started and cannot be executed again.", 409);
  }

  // Credentials live only in this request scope. They are handed to the runner
  // in memory and never persisted or logged.
  let summary;
  try {
    summary = await executeRun({
      runId: run.id,
      userId: user.id,
      baseUrl: safeBaseUrl.data,
      goal: run.goal,
      credentials: {
        loginUrl: parsed.data.loginUrl,
        email: parsed.data.loginEmail,
        password: parsed.data.loginPassword,
      },
    });
  } catch {
    const message = "The browser runner could not start. Check the worker and Playwright installation.";
    await prisma.qaRun
      .update({
        where: { id: run.id },
        data: { status: "FAILED", finishedAt: new Date(), summary: message, score: 0 },
      })
      .catch(() => null);
    return apiError(message, 500);
  }

  if (summary.status === "COMPLETED") {
    await generateRunTests(run.id).catch(async () => {
      await prisma.qaRun
        .update({ where: { id: run.id }, data: { generatedTestStatus: "FAILED" } })
        .catch(() => null);
    });
  }

  if (summary.status === "FAILED") {
    return apiError(summary.summary, 500, { summary });
  }
  return apiSuccess({ summary });
}
