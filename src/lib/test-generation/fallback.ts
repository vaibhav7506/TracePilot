import { getPlatformSettings, type TestGenerationSettings } from "@/lib/settings/config";
import { containsUnsafeTestIntent } from "@/lib/test-generation/safety";

type RunEvidence = {
  baseUrl: string;
  usedLoginCredentials: boolean;
  routes: string[];
  findings: Array<{
    title: string;
    description?: string;
    severity: string;
    category?: string;
    url: string | null;
    selector?: string | null;
    reproductionSteps: unknown;
  }>;
};

export type TestKind = "smoke" | "navigation" | "form" | "regression" | "auth";
export type TestFile = { kind: TestKind; title: string; fileName: string; code: string };

function pathFromUrl(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    const base = new URL(baseUrl);
    return url.origin === base.origin ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

function literal(value: string): string {
  return JSON.stringify(value);
}

export function generateFallbackTests(
  evidence: RunEvidence,
  generationSettings: TestGenerationSettings = getPlatformSettings().testGeneration,
): TestFile[] {
  const routes = Array.from(
    new Set(
      ["/", ...evidence.routes, ...evidence.findings.flatMap((finding) => finding.url ?? [])]
        .filter((route) => !containsUnsafeTestIntent(route))
        .map((route) => pathFromUrl(route, evidence.baseUrl))
        .filter((route): route is string => Boolean(route)),
    ),
  ).slice(0, 12);
  const routeList = routes.map(literal).join(", ");
  const tests: TestFile[] = [];

  if (generationSettings.includeSmokeTests) {
    tests.push({
      kind: "smoke",
      title: "Application smoke coverage",
      fileName: "smoke.spec.ts",
      code: `import { expect, test } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

test("homepage loads without critical console errors", async ({ page }) => {
  // Capture uncaught page errors while validating the main entry point.
  const criticalErrors: string[] = [];
  page.on("pageerror", (error) => criticalErrors.push(error.message));

  const response = await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  expect(response?.status(), "homepage should return a successful response").toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main, body").first()).toBeVisible();
  expect(new URL(page.url()).pathname.toLowerCase()).not.toContain("error");
  expect(criticalErrors, "homepage should not produce uncaught errors").toEqual([]);
});
`,
    });
  }

  if (generationSettings.includeNavigationTests) {
    tests.push({
      kind: "navigation",
      title: "Important route navigation",
      fileName: "navigation.spec.ts",
      code: `import { expect, test } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const importantRoutes = [${routeList}];

for (const route of importantRoutes) {
  test(\`important route \${route} loads\`, async ({ page }) => {
    // Verify each route discovered by the QA run remains reachable.
    const response = await page.goto(new URL(route, baseURL).toString(), { waitUntil: "domcontentloaded" });
    expect(response?.status(), \`\${route} should not return an error response\`).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("main, body").first()).toBeVisible();
    expect(new URL(page.url()).pathname.toLowerCase()).not.toContain("error");
  });
}
`,
    });
  }

  if (generationSettings.includeFormTests) {
    const formRoute = evidence.findings
      .filter((finding) => finding.category === "FORM")
      .map((finding) => pathFromUrl(finding.url ?? "", evidence.baseUrl))
      .find((route): route is string => route !== null && routes.includes(route));
    tests.push({
      kind: "form",
      title: "Required form validation",
      fileName: "form-validation.spec.ts",
      code: `import { expect, test } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const formRoute = ${literal(formRoute ?? routes[0] ?? "/")};

test("required fields expose native validation", async ({ page }) => {
  // Inspect required controls without filling or submitting the form.
  await page.goto(new URL(formRoute, baseURL).toString(), { waitUntil: "domcontentloaded" });
  const form = page.locator("form").first();
  test.skip((await form.count()) === 0, "No form was discovered on this captured route");
  const required = form.locator("input[required], select[required], textarea[required]").first();
  test.skip((await required.count()) === 0, "The discovered form has no required controls");
  await expect(required).toBeVisible();
  expect(await required.evaluate((element) => (element as HTMLInputElement).checkValidity())).toBe(false);
});
`,
    });
  }

  const regressions = evidence.findings.filter(
    (finding) =>
      ["HIGH", "CRITICAL"].includes(finding.severity) &&
      !containsUnsafeTestIntent(
        finding.title,
        finding.description,
        finding.url,
        ...(Array.isArray(finding.reproductionSteps) ? finding.reproductionSteps : []),
      ),
  );
  if (generationSettings.includeRegressionTests && regressions.length > 0) {
    const cases = regressions
      .map((finding) => ({
        title: finding.title,
        path: pathFromUrl(finding.url ?? "", evidence.baseUrl),
      }))
      .filter(
        (finding): finding is { title: string; path: string } =>
          Boolean(finding.path) && routes.includes(finding.path ?? ""),
      );
    if (cases.length > 0) {
      tests.push({
        kind: "regression",
        title: "High-severity finding regressions",
        fileName: "finding-regressions.spec.ts",
        code: `import { expect, test } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const regressions = ${JSON.stringify(cases, null, 2)};

for (const regression of regressions) {
  test(\`regression: \${regression.title}\`, async ({ page }) => {
    // Revisit only the captured route and assert read-only health signals.
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(new URL(regression.path, baseURL).toString(), { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("main, body").first()).toBeVisible();
    expect(pageErrors, "the affected route should not throw an uncaught error").toEqual([]);
  });
}
`,
      });
    }
  }

  const loginRoute = routes.find((route) => /\/(?:login|sign-in|signin|auth)(?:\/|$)/i.test(route));
  if (evidence.usedLoginCredentials && loginRoute) {
    tests.push({
      kind: "auth",
      title: "Authenticated route readiness",
      fileName: "auth-flow.spec.ts",
      code: `import { expect, test } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const loginRoute = ${literal(loginRoute)};

test("captured login route is ready for runtime credentials", async ({ page }) => {
  // Confirm runtime placeholders and the discovered route without entering credentials.
  expect(email, "TEST_EMAIL must be supplied at execution time").toBeTruthy();
  expect(password, "TEST_PASSWORD must be supplied at execution time").toBeTruthy();
  const response = await page.goto(new URL(loginRoute, baseURL).toString(), { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main, body").first()).toBeVisible();
});
`,
    });
  }

  return tests;
}
