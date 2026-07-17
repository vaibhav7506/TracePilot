import { Camera, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

const testSource = `import { test, expect } from "@playwright/test";

test("checkout reaches receipt", async ({ page }) => {
  await page.goto("https://staging.acme.dev");
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email").fill("qa@acme.dev");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Submit payment" }).click();
  // ✗ timed out after 5000ms — receipt never rendered
  await expect(page.getByText("Receipt")).toBeVisible();
});`;

export function ReportPreview() {
  return (
    <Section spacing="lg">
      <Reveal>
        <SectionHeader
          eyebrow="Report preview"
          title="Every run ends in an answer, not a log dump."
          description="A single failing flow, reconstructed — severity, the exact step that broke, the screen at the moment it happened, and a test that reproduces it."
          actions={
            <Button asChild variant="outline">
              <Link href="/runs/run_9f2ac71b">Open full report</Link>
            </Button>
          }
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <Card className="overflow-hidden">
          {/* Report header */}
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="ruby" dot={false}>
                <TriangleAlert className="h-3 w-3" aria-hidden />
                Failed
              </Badge>
              <div className="font-mono text-xs text-muted-foreground">
                run_9f2ac71b · staging.acme.dev
              </div>
            </div>
            <div className="flex items-center gap-5 font-mono text-[0.7rem] text-muted-foreground">
              <span>18 steps</span>
              <span>3 issues</span>
              <span>1m 14s</span>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            {/* Left: issue + broken step */}
            <div className="flex flex-col gap-6 border-b border-border p-6 lg:border-b-0 lg:border-r">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 font-mono text-[0.68rem] font-medium uppercase tracking-wider text-primary-foreground">
                    Critical
                  </span>
                  <span className="font-mono text-[0.7rem] text-muted-foreground">/checkout</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                  Payment submit never resolves
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <code className="font-mono text-[0.8rem] text-foreground">POST /api/payment</code>{" "}
                  hung for 5s and returned 500. The receipt route was never reached, so checkout
                  cannot complete.
                </p>
              </div>

              <div className="rounded-md border border-border bg-muted/30">
                <div className="border-b border-border px-4 py-2 font-mono text-[0.7rem] uppercase tracking-eyebrow text-muted-foreground">
                  Broken step
                </div>
                <ol className="divide-y divide-border">
                  <StepRow index="06" action="NAVIGATE" label="Proceed to /checkout" ok />
                  <StepRow index="07" action="CLICK" label="Submit payment" ok={false} />
                  <StepRow index="08" action="ASSERT" label="Receipt page renders" skipped />
                </ol>
              </div>

              <ul className="flex flex-col gap-2 font-mono text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  console: Uncaught TypeError in cart-summary.tsx
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-wine" aria-hidden />
                  network: POST /api/payment → 500 (5,012ms)
                </li>
              </ul>
            </div>

            {/* Right: screenshot + generated test */}
            <div className="flex flex-col gap-5 p-6">
              <figure className="overflow-hidden rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" aria-hidden />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" aria-hidden />
                  <span className="ml-2 truncate font-mono text-[0.7rem] text-muted-foreground">
                    staging.acme.dev/checkout
                  </span>
                </div>
                <div className="relative aspect-[16/10]">
                  <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
                  <span className="absolute right-3 top-3 rounded bg-primary px-1.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-wider text-primary-foreground">
                    step 07
                  </span>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Camera className="h-6 w-6" aria-hidden />
                    <span className="font-mono text-[0.7rem]">checkout_step07.png</span>
                  </div>
                </div>
                <figcaption className="border-t border-border px-3 py-2 font-mono text-[0.7rem] text-muted-foreground">
                  captured at failure · 1280×800
                </figcaption>
              </figure>

              <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <span className="font-mono text-[0.7rem] text-muted-foreground">
                    checkout.spec.ts
                  </span>
                  <Badge variant="outline">generated</Badge>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-[0.72rem] leading-relaxed text-muted-foreground">
                  <code>{testSource}</code>
                </pre>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}

function StepRow({
  index,
  action,
  label,
  ok,
  skipped,
}: {
  index: string;
  action: string;
  label: string;
  ok?: boolean;
  skipped?: boolean;
}) {
  const dot = skipped ? "bg-muted-foreground/40" : ok ? "bg-foreground/40" : "bg-primary";
  const status = skipped ? "skipped" : ok ? "passed" : "failed";
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="font-mono text-[0.7rem] text-muted-foreground">{index}</span>
      <span className="font-mono text-[0.7rem] text-muted-foreground">{action}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
      <span
        className={`font-mono text-[0.68rem] uppercase tracking-wider ${
          status === "failed" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {status}
      </span>
    </li>
  );
}
