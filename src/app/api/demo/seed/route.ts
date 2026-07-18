import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return apiError("Authentication required.", 401);
  const finishedAt = new Date();
  const startedAt = new Date(finishedAt.getTime() - 74_000);
  try {
    const run = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        userId: user.id,
        name: "Northstar Commerce",
        baseUrl: "https://demo.tracepilot.local",
      },
    });
    return tx.qaRun.create({
      data: {
        userId: user.id,
        projectId: project.id,
        status: "COMPLETED",
        goal: "Validate sign-in, product discovery, cart state, and checkout readiness without placing an order.",
        startedAt,
        finishedAt,
        summary:
          "Core browsing and cart flows completed, but checkout readiness is blocked by a 500 response from the pricing endpoint. The failure also triggers an uncaught cart-summary exception, creating a high-risk regression before payment.",
        score: 40,
        aiProvider: "Demo provider",
        aiModel: "recruiter-demo",
        aiAnalysisStatus: "COMPLETED",
        generatedTestStatus: "GENERATED",
        aiAnalysis: {
          whatPassed: [
            "Homepage and product routes loaded successfully",
            "Authentication flow reached the account dashboard",
            "Cart state persisted between product and checkout routes",
          ],
          whatFailed: [
            "Checkout pricing request returned HTTP 500",
            "Cart summary threw an uncaught exception after the pricing failure",
          ],
          mostRiskyIssue:
            "Customers cannot verify the final order total, so checkout is not safely actionable.",
          recommendedNextTest:
            "Retest checkout with pricing-service success, timeout, and invalid-promotion responses.",
          recommendedActions: [
            "Inspect pricing-service logs for the failing cart payload",
            "Add an explicit error boundary around the checkout summary",
            "Run the generated checkout regression test in CI",
          ],
        },
        aiTestPlan: {
          orderedTestPlan: ["Load homepage", "Open product", "Add to cart", "Open checkout"],
          priorityRoutes: ["/", "/products/travel-pack", "/cart", "/checkout"],
          riskyFlows: ["Cart pricing and checkout summary"],
          formInteractionSuggestions: ["Validate sign-in required fields"],
          destructiveActionWarnings: ["Do not place the final order"],
        },
        steps: {
          create: [
            {
              order: 1,
              action: "navigate",
              url: "https://demo.tracepilot.local",
              result: "passed",
              screenshotPath: "demo://step-01",
              consoleErrors: [],
              networkErrors: [],
            },
            {
              order: 2,
              action: "click",
              target: "Sign in",
              url: "https://demo.tracepilot.local/login",
              result: "passed",
              screenshotPath: "demo://step-02",
              consoleErrors: [],
              networkErrors: [],
            },
            {
              order: 3,
              action: "login",
              target: "login form",
              url: "https://demo.tracepilot.local/account",
              result: "passed",
              screenshotPath: "demo://step-03",
              consoleErrors: [],
              networkErrors: [],
            },
            {
              order: 4,
              action: "navigate",
              target: "Travel Pack",
              url: "https://demo.tracepilot.local/products/travel-pack",
              result: "passed",
              screenshotPath: "demo://step-04",
              consoleErrors: [],
              networkErrors: [],
            },
            {
              order: 5,
              action: "click",
              target: "Add to cart",
              url: "https://demo.tracepilot.local/cart",
              result: "passed",
              screenshotPath: "demo://step-05",
              consoleErrors: [],
              networkErrors: [],
            },
            {
              order: 6,
              action: "navigate",
              target: "Checkout",
              url: "https://demo.tracepilot.local/checkout",
              result: "failed",
              screenshotPath: "demo://step-06",
              consoleErrors: [
                "Uncaught TypeError: Cannot read properties of undefined (reading 'total')",
              ],
              networkErrors: ["POST /api/pricing → 500"],
            },
          ],
        },
        findings: {
          create: [
            {
              title: "Checkout pricing request returns 500",
              description:
                "The checkout route cannot calculate a final total after the pricing endpoint returns HTTP 500.\n\nUser impact: Customers cannot verify totals or safely continue toward payment.\n\nRoot cause hypothesis: The pricing service rejects the serialized cart payload.\n\nSuggested fix direction: Validate the cart contract and return a recoverable pricing error state.",
              severity: "CRITICAL",
              category: "NETWORK",
              url: "https://demo.tracepilot.local/checkout",
              screenshotPath: "demo://step-06",
              reproductionSteps: [
                "Add the Travel Pack to cart",
                "Open /checkout",
                "Observe POST /api/pricing return 500",
              ],
            },
            {
              title: "Cart summary throws after pricing failure",
              description:
                "The checkout summary reads total from an undefined pricing response.\n\nUser impact: The order summary disappears and the page becomes unreliable.\n\nRoot cause hypothesis: The component assumes pricing data is always present.\n\nSuggested fix direction: Guard missing pricing data and render a retryable error boundary.",
              severity: "HIGH",
              category: "CONSOLE",
              url: "https://demo.tracepilot.local/checkout",
              screenshotPath: "demo://step-06",
              reproductionSteps: [
                "Open checkout with an item in cart",
                "Trigger a pricing failure",
                "Observe the console and missing summary",
              ],
            },
            {
              title: "Sign-in validation message lacks field association",
              description:
                "The empty email message is visible but is not associated with its input for assistive technology.\n\nUser impact: Keyboard and screen-reader users receive unclear validation feedback.\n\nSuggested fix direction: Connect the message with aria-describedby and aria-invalid.",
              severity: "MEDIUM",
              category: "ACCESSIBILITY",
              url: "https://demo.tracepilot.local/login",
              screenshotPath: "demo://step-02",
              reproductionSteps: [
                "Open /login",
                "Submit the empty form",
                "Inspect the email field accessibility relationship",
              ],
            },
          ],
        },
        generatedTests: {
          create: [
            {
              title: "Application smoke coverage",
              fileName: "smoke.spec.ts",
              framework: "playwright",
              provider: "Demo provider",
              model: "recruiter-demo",
              generationMode: "AI",
              code: `import { expect, test } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

test("homepage exposes healthy read-only signals", async ({ page }) => {
  // Validate the discovered entry point without interacting with stateful controls.
  const response = await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main, body").first()).toBeVisible();
});`,
            },
          ],
        },
      },
      select: { id: true },
    });
    });
    return apiSuccess({ runId: run.id }, 201);
  } catch {
    return apiError("Could not seed demo data. Configure DATABASE_URL and apply migrations first.", 500);
  }
}
