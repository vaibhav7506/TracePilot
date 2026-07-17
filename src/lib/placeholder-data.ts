import type { FindingCategory, FindingSeverity, RunStatus } from "@/lib/status";

/**
 * The one sample report used by the landing page's "View Demo Report" link
 * (/runs/run_9f2ac71b). Shaped exactly like the Prisma query result the run
 * detail page consumes, so the demo renders through the same components as a
 * real run. Removed once seeded demo data ships with the agent phase.
 */

export const DEMO_RUN_ID = "run_9f2ac71b";

export interface DemoStep {
  id: string;
  order: number;
  action: string;
  target: string | null;
  url: string | null;
  result: string | null;
  screenshotPath: string | null;
  consoleErrors: string[];
  networkErrors: string[];
}

export interface DemoFinding {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  url: string | null;
  selector: string | null;
  screenshotPath: string | null;
  reproductionSteps: string[];
}

export interface DemoGeneratedTest {
  id: string;
  title: string;
  framework: string;
  code: string;
}

export interface DemoRun {
  id: string;
  status: RunStatus;
  goal: string;
  summary: string | null;
  score: number | null;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
  project: { name: string; baseUrl: string };
  steps: DemoStep[];
  findings: DemoFinding[];
  generatedTests: DemoGeneratedTest[];
}

export const demoRun: DemoRun = {
  id: DEMO_RUN_ID,
  status: "FAILED",
  goal: "Complete checkout with a saved card and reach the receipt page.",
  summary:
    "Checkout is blocked at payment. POST /api/payment returns 500 after a 5s hang, and an uncaught TypeError in the cart summary fires on the same screen. 6 of 8 planned steps passed; the receipt page was never reached.",
  score: 41,
  startedAt: "2026-07-03T14:22:06Z",
  finishedAt: "2026-07-03T14:23:20Z",
  createdAt: "2026-07-03T14:22:00Z",
  project: { name: "Acme storefront", baseUrl: "https://staging.acme.dev" },
  steps: [
    { id: "st_1", order: 1, action: "navigate", target: null, url: "https://staging.acme.dev", result: "passed", screenshotPath: "step01.png", consoleErrors: [], networkErrors: [] },
    { id: "st_2", order: 2, action: "click", target: "link:has-text('Sign in')", url: "/login", result: "passed", screenshotPath: "step02.png", consoleErrors: [], networkErrors: [] },
    { id: "st_3", order: 3, action: "type", target: "input[name=email]", url: "/login", result: "passed", screenshotPath: "step03.png", consoleErrors: [], networkErrors: [] },
    { id: "st_4", order: 4, action: "assert", target: "heading:has-text('Dashboard')", url: "/account", result: "passed", screenshotPath: "step04.png", consoleErrors: [], networkErrors: [] },
    { id: "st_5", order: 5, action: "click", target: "button:has-text('Add to cart')", url: "/products/anvil", result: "passed", screenshotPath: "step05.png", consoleErrors: [], networkErrors: [] },
    { id: "st_6", order: 6, action: "navigate", target: null, url: "/checkout", result: "passed", screenshotPath: "step06.png", consoleErrors: ["Uncaught TypeError: Cannot read properties of undefined (reading 'total')"], networkErrors: [] },
    { id: "st_7", order: 7, action: "click", target: "button:has-text('Submit payment')", url: "/checkout", result: "failed", screenshotPath: "step07.png", consoleErrors: [], networkErrors: ["POST /api/payment → 500 (5,012ms)"] },
    { id: "st_8", order: 8, action: "assert", target: "text=Receipt", url: "/checkout", result: "skipped", screenshotPath: null, consoleErrors: [], networkErrors: [] },
  ],
  findings: [
    {
      id: "fd_1",
      title: "Payment submit never resolves",
      description:
        "POST /api/payment hung for 5 seconds and returned 500. The receipt route was never reached, so checkout cannot complete.",
      severity: "CRITICAL",
      category: "NETWORK",
      url: "https://staging.acme.dev/checkout",
      selector: "button:has-text('Submit payment')",
      screenshotPath: "step07.png",
      reproductionSteps: [
        "Sign in as qa@acme.dev",
        "Add any product to the cart",
        "Navigate to /checkout",
        "Click 'Submit payment'",
        "Observe the request to /api/payment hang, then fail with 500",
      ],
    },
    {
      id: "fd_2",
      title: "Uncaught TypeError in cart summary",
      description:
        "Cannot read properties of undefined (reading 'total') fires when /checkout renders — the order total is blank while the error is swallowed in production builds.",
      severity: "HIGH",
      category: "CONSOLE",
      url: "https://staging.acme.dev/checkout",
      selector: "[data-testid=cart-summary]",
      screenshotPath: "step06.png",
      reproductionSteps: ["Add any product to the cart", "Navigate to /checkout", "Open the console"],
    },
    {
      id: "fd_3",
      title: "Slow first paint on checkout",
      description:
        "Largest Contentful Paint measured at 4.1s on a throttled connection — the payment iframe blocks rendering.",
      severity: "MEDIUM",
      category: "UI",
      url: "https://staging.acme.dev/checkout",
      selector: null,
      screenshotPath: null,
      reproductionSteps: ["Throttle to Fast 3G", "Navigate to /checkout", "Measure LCP"],
    },
  ],
  generatedTests: [
    {
      id: "gt_1",
      title: "checkout reaches receipt",
      framework: "playwright",
      code: `import { test, expect } from "@playwright/test";

test("checkout reaches receipt", async ({ page }) => {
  await page.goto("https://staging.acme.dev");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill("qa@acme.dev");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Submit payment" }).click();
  // ✗ timed out after 5000ms — receipt never rendered
  await expect(page.getByText("Receipt")).toBeVisible();
});`,
    },
  ],
};
