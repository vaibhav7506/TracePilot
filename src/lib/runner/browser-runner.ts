import { chromium, type Browser, type ElementHandle, type Page } from "playwright";
import { prisma } from "@/lib/prisma";
import {
  RUNNER_LIMITS,
  isDestructive,
  redactCredentials,
} from "@/lib/runner/safety";
import { ensureRunDir, publicPath, screenshotFile } from "@/lib/runner/screenshots";
import {
  isHttpUrl,
  normalizeUrl,
  pathOf,
  resolveHref,
  sameHostname,
} from "@/lib/runner/url-utils";
import type {
  FindingSeverity,
  RunnerFinding,
  RunnerInput,
  RunnerStep,
  RunnerSummary,
  StepResult,
} from "@/lib/runner/types";

/**
 * Deterministic Playwright browser runner.
 *
 * ── DEPLOYMENT ──────────────────────────────────────────────────────────────
 * This module launches a real Chromium process and can run for up to
 * RUNNER_LIMITS.maxRuntimeMs. It MUST run in a long-lived Node.js server or a
 * background worker — NOT in an edge runtime and NOT in a short-timeout
 * serverless function (browser launch alone can exceed a 10s function budget,
 * and the filesystem for screenshots must be writable). For production, move
 * this behind a queue/worker and stream status back to the client. It is called
 * inline from POST /api/runs/[id]/execute for local development only.
 *
 * There is NO AI in this phase — exploration and bug capture are entirely
 * rule-based. Credentials are used only in-memory to log in and are never
 * logged, persisted, or sent anywhere.
 */

const ELEMENT_TIMEOUT = 6_000;
const SETTLE_MS = 400;

function truncate(text: string, max = 300): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function computeScore(findings: RunnerFinding[]): number {
  const weight: Record<FindingSeverity, number> = {
    CRITICAL: 30,
    HIGH: 18,
    MEDIUM: 8,
    LOW: 3,
  };
  let score = 100;
  for (const finding of findings) score -= weight[finding.severity];
  return Math.max(0, Math.min(100, score));
}

function buildSummary(routes: number, steps: number, findings: RunnerFinding[]): string {
  const order: FindingSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const tally = new Map<FindingSeverity, number>();
  for (const finding of findings) tally.set(finding.severity, (tally.get(finding.severity) ?? 0) + 1);
  const parts = order
    .filter((severity) => (tally.get(severity) ?? 0) > 0)
    .map((severity) => `${tally.get(severity)} ${severity.toLowerCase()}`);
  const findingText =
    findings.length > 0
      ? `Captured ${findings.length} finding${findings.length === 1 ? "" : "s"} (${parts.join(", ")}).`
      : "No issues detected.";
  return `Explored ${routes} route${routes === 1 ? "" : "s"} across ${steps} step${
    steps === 1 ? "" : "s"
  }. ${findingText}`;
}

/**
 * Run one deterministic QA session. Persists BrowserStep and Finding rows as it
 * goes, and updates the QaRun status (RUNNING → COMPLETED | FAILED). Resolves
 * with a credential-free summary; never throws.
 */
export async function executeRun(input: RunnerInput): Promise<RunnerSummary> {
  const { runId, baseUrl, credentials } = input;
  const deadline = Date.now() + RUNNER_LIMITS.maxRuntimeMs;
  const navTimeout = RUNNER_LIMITS.navigationTimeoutMs;

  const safeMessage = (err: unknown): string =>
    truncate(redactCredentials(err instanceof Error ? err.message : String(err), credentials));

  await prisma.qaRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: new Date() },
  });
  await ensureRunDir(runId);

  const findings: RunnerFinding[] = [];
  const seenFindings = new Set<string>();
  const visited = new Set<string>();
  const trail: string[] = [];
  let stepCount = 0;

  // Per-step error buffers; listeners push here, steps drain them.
  const consoleBuffer: string[] = [];
  const networkBuffer: string[] = [];

  const addFinding = async (finding: RunnerFinding): Promise<void> => {
    if (findings.length >= 40) return;
    const key = `${finding.category}|${finding.title}|${finding.url ?? ""}|${finding.description.slice(0, 60)}`;
    if (seenFindings.has(key)) return;
    seenFindings.add(key);
    findings.push(finding);
    await prisma.finding.create({
      data: {
        runId,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        category: finding.category,
        url: finding.url,
        selector: finding.selector,
        screenshotPath: finding.screenshotPath,
        reproductionSteps: finding.reproductionSteps,
      },
    });
  };

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      // --no-sandbox is required in many containerized Node environments.
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleBuffer.push(truncate(redactCredentials(msg.text(), credentials)));
      }
    });
    page.on("pageerror", (err) => {
      consoleBuffer.push(truncate(redactCredentials(`Uncaught ${err.message}`, credentials)));
    });
    page.on("requestfailed", (req) => {
      const failure = req.failure();
      networkBuffer.push(
        truncate(`${req.method()} ${pathOf(req.url())} — ${failure?.errorText ?? "request failed"}`),
      );
    });
    page.on("response", (res) => {
      const status = res.status();
      if (status >= 400) {
        networkBuffer.push(truncate(`${res.request().method()} ${pathOf(res.url())} → ${status}`));
      }
    });

    // Drain buffers, take a screenshot, persist the step.
    const captureAndRecord = async (
      order: number,
      action: string,
      target: string | null,
      url: string | null,
      result: StepResult,
    ): Promise<RunnerStep> => {
      await page.waitForTimeout(SETTLE_MS);
      const stepConsole = consoleBuffer.splice(0);
      const stepNetwork = networkBuffer.splice(0);

      let screenshotPath: string | null = null;
      try {
        await page.screenshot({ path: screenshotFile(runId, order) });
        screenshotPath = publicPath(runId, order);
      } catch {
        // A screenshot failure must not fail the whole run.
      }

      const step: RunnerStep = {
        order,
        action,
        target,
        url,
        result,
        screenshotPath,
        consoleErrors: stepConsole,
        networkErrors: stepNetwork,
      };
      await prisma.browserStep.create({
        data: {
          runId,
          order: step.order,
          action: step.action,
          target: step.target,
          url: step.url,
          result: step.result,
          screenshotPath: step.screenshotPath,
          consoleErrors: step.consoleErrors,
          networkErrors: step.networkErrors,
        },
      });
      return step;
    };

    // Turn a recorded step's captured signals into findings.
    const detectFindings = async (step: RunnerStep): Promise<void> => {
      for (const line of step.consoleErrors) {
        const uncaught = line.startsWith("Uncaught");
        await addFinding({
          title: uncaught ? "Uncaught error in page" : "Console error",
          description: line,
          severity: uncaught ? "HIGH" : "MEDIUM",
          category: "CONSOLE",
          url: step.url,
          selector: null,
          screenshotPath: step.screenshotPath,
          reproductionSteps: [...trail],
        });
      }
      for (const line of step.networkErrors) {
        const serverError = /→\s*5\d\d$/.test(line);
        await addFinding({
          title: serverError ? "Server error response" : "Failed network request",
          description: line,
          severity: serverError ? "HIGH" : "MEDIUM",
          category: "NETWORK",
          url: step.url,
          selector: null,
          screenshotPath: step.screenshotPath,
          reproductionSteps: [...trail],
        });
      }

      // Error-like page heuristic (title + first heading only, to limit noise).
      const title = await page.title().catch(() => "");
      const heading = await page
        .locator("h1")
        .first()
        .innerText({ timeout: 1_500 })
        .catch(() => "");
      const errorish =
        /(\b404\b|\b500\b|not found|page not found|internal server error|something went wrong)/i;
      if (errorish.test(title) || errorish.test(heading)) {
        await addFinding({
          title: "Error-like page reached",
          description: `"${(title || heading).slice(0, 140)}" at ${pathOf(step.url ?? baseUrl)}`,
          severity: "HIGH",
          category: "ROUTE",
          url: step.url,
          selector: null,
          screenshotPath: step.screenshotPath,
          reproductionSteps: [...trail],
        });
      }
    };

    // 1) Optional login — credentials stay in-memory, never logged.
    if (credentials?.loginUrl && credentials.email && credentials.password) {
      const loginUrl = credentials.loginUrl;
      const email = credentials.email;
      const password = credentials.password;

      stepCount += 1;
      const order = stepCount;
      let result: StepResult = "passed";
      try {
        await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: navTimeout });
        await page
          .locator(
            'input[type="email"], input[name="email"], input[name="username"], input[autocomplete="username"]',
          )
          .first()
          .fill(email, { timeout: ELEMENT_TIMEOUT });
        await page
          .locator('input[type="password"], input[name="password"]')
          .first()
          .fill(password, { timeout: ELEMENT_TIMEOUT });
        await Promise.all([
          page.waitForLoadState("domcontentloaded", { timeout: navTimeout }).catch(() => {}),
          page
            .locator(
              'button[type="submit"], input[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")',
            )
            .first()
            .click({ timeout: ELEMENT_TIMEOUT }),
        ]);

        // Heuristic: a password field still present suggests the form failed.
        const stillHasPassword = await page
          .locator('input[type="password"]')
          .first()
          .isVisible()
          .catch(() => false);
        if (stillHasPassword) {
          result = "failed";
          await addFinding({
            title: "Login form submission failed",
            description:
              "A password field is still visible after submitting the login form, so authentication likely did not succeed.",
            severity: "MEDIUM",
            category: "AUTH",
            url: page.url(),
            selector: null,
            screenshotPath: null,
            reproductionSteps: [...trail],
          });
        }
      } catch (err) {
        result = "failed";
        await addFinding({
          title: "Could not complete login",
          description: `The login step could not finish: ${safeMessage(err)}`,
          severity: "MEDIUM",
          category: "AUTH",
          url: loginUrl,
          selector: null,
          screenshotPath: null,
          reproductionSteps: [...trail],
        });
      }
      trail.push("Attempt login");
      const step = await captureAndRecord(order, "login", "login form", page.url(), result);
      await detectFindings(step);
    }

    // 2) Navigate to the target.
    {
      stepCount += 1;
      const order = stepCount;
      let result: StepResult = "passed";
      try {
        const resp = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: navTimeout });
        if (resp && resp.status() >= 400) result = "failed";
      } catch (err) {
        result = "failed";
        await addFinding({
          title: "Initial navigation failed",
          description: `Could not load ${pathOf(baseUrl)}: ${safeMessage(err)}`,
          severity: "CRITICAL",
          category: "ROUTE",
          url: baseUrl,
          selector: null,
          screenshotPath: null,
          reproductionSteps: [...trail],
        });
      }
      const norm = normalizeUrl(page.url());
      if (norm) visited.add(norm);
      trail.push(`Navigate to ${pathOf(page.url())}`);
      const step = await captureAndRecord(order, "navigate", null, page.url(), result);
      await detectFindings(step);
    }

    // 3) Explore — follow safe, internal, unvisited links.
    while (stepCount < RUNNER_LIMITS.maxSteps && Date.now() < deadline) {
      const chosen = await pickNextLink(page, baseUrl, visited);
      if (!chosen) break;

      stepCount += 1;
      const order = stepCount;
      const urlBefore = page.url();
      let result: StepResult = "passed";
      try {
        await chosen.handle.scrollIntoViewIfNeeded({ timeout: 4_000 });
        await Promise.all([
          page.waitForLoadState("domcontentloaded", { timeout: navTimeout }).catch(() => {}),
          chosen.handle.click({ timeout: ELEMENT_TIMEOUT }),
        ]);
      } catch (err) {
        result = "failed";
        await addFinding({
          title: "Click failed",
          description: `Could not click "${chosen.text || pathOf(chosen.abs)}": ${safeMessage(err)}`,
          severity: "LOW",
          category: "UI",
          url: urlBefore,
          selector: null,
          screenshotPath: null,
          reproductionSteps: [...trail],
        });
      }

      const urlAfter = page.url();
      visited.add(chosen.norm);
      const normAfter = normalizeUrl(urlAfter);
      if (normAfter) visited.add(normAfter);
      trail.push(`Click "${chosen.text || pathOf(chosen.abs)}" → ${pathOf(urlAfter)}`);

      const step = await captureAndRecord(order, "click", chosen.text || pathOf(chosen.abs), urlAfter, result);
      await detectFindings(step);

      if (result === "passed" && normalizeUrl(urlBefore) === normAfter && step.consoleErrors.length === 0) {
        await addFinding({
          title: "Link did not navigate",
          description: `Clicking "${chosen.text || pathOf(chosen.abs)}" did not change the route or trigger any visible effect.`,
          severity: "LOW",
          category: "UI",
          url: urlAfter,
          selector: null,
          screenshotPath: step.screenshotPath,
          reproductionSteps: [...trail],
        });
      }
    }

    const score = computeScore(findings);
    const summary = buildSummary(visited.size, stepCount, findings);
    await prisma.qaRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", finishedAt: new Date(), summary, score },
    });
    await context.close();

    return { status: "COMPLETED", summary, score, stepCount, findingCount: findings.length };
  } catch (err) {
    const message = safeMessage(err);
    const summary = `Run failed after ${stepCount} step${stepCount === 1 ? "" : "s"}: ${message}`;
    try {
      await prisma.qaRun.update({
        where: { id: runId },
        data: { status: "FAILED", finishedAt: new Date(), summary, score: 0 },
      });
    } catch {
      // Swallow — the original error is what matters.
    }
    return { status: "FAILED", summary, score: 0, stepCount, findingCount: findings.length, error: message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

type LinkChoice = {
  handle: ElementHandle<SVGElement | HTMLElement>;
  abs: string;
  norm: string;
  text: string;
};

/** Pick the first safe, internal, unvisited, visible link on the current page. */
async function pickNextLink(
  page: Page,
  baseUrl: string,
  visited: Set<string>,
): Promise<LinkChoice | null> {
  const current = page.url();
  const anchors = await page.$$("a[href]");
  let considered = 0;

  for (const handle of anchors) {
    if (considered >= RUNNER_LIMITS.maxLinksPerPage) break;

    const hrefAttr = await handle.getAttribute("href");
    if (!hrefAttr) continue;

    const abs = resolveHref(current, hrefAttr);
    if (!abs || !isHttpUrl(abs) || !sameHostname(abs, baseUrl)) continue;

    const norm = normalizeUrl(abs);
    if (!norm || visited.has(norm)) continue;

    const text = ((await handle.textContent()) ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    considered += 1;

    // Never click destructive/high-consequence links.
    if (isDestructive(text, abs)) continue;

    const visible = await handle.isVisible().catch(() => false);
    if (!visible) continue;

    return { handle, abs, norm, text };
  }
  return null;
}
