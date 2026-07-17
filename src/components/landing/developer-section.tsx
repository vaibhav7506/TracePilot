import { Reveal } from "@/components/animations/reveal";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

const pillars = [
  {
    label: "Playwright",
    title: "Runs on Playwright",
    body: "The same automation engine your team already trusts. Exported specs are plain Playwright — no proprietary format, no lock-in.",
  },
  {
    label: "Traces",
    title: "Structured, replayable traces",
    body: "Every action is a typed trace step — not a screen recording you have to scrub. Filter, diff, and replay them.",
  },
  {
    label: "Evidence",
    title: "Screenshots & DOM snapshots",
    body: "A pixel and DOM capture at each step, so a failure is something you can see and inspect, not guess at.",
  },
  {
    label: "Analysis",
    title: "AI grounded in real signals",
    body: "The model reads the traces, console, and network to explain root cause — reasoning over evidence, not vibes.",
  },
];

const trace = `{
  "step": 7,
  "action": "click",
  "target": "button:has-text('Submit payment')",
  "status": "failed",
  "durationMs": 5012,
  "console": ["Uncaught TypeError: cart.total"],
  "network": [
    { "url": "/api/payment", "status": 500 }
  ],
  "screenshot": "checkout_step07.png"
}`;

export function DeveloperSection() {
  return (
    <Section spacing="lg">
      <Reveal className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Trace card */}
        <Card className="order-2 overflow-hidden bg-card/60 lg:order-1">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/70" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
            <span className="ml-3 font-mono text-xs text-muted-foreground">trace.step[7].json</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[0.74rem] leading-relaxed text-muted-foreground">
            <code>{trace}</code>
          </pre>
        </Card>

        {/* Pillars */}
        <div className="order-1 lg:order-2">
          <span className="eyebrow">Built for engineers</span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-[1.7rem]">
            Real tooling under the hood — not a black box.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
            TracePilot is transparent by design. Every claim in a report traces back to something
            you can open, replay, and verify yourself.
          </p>

          <dl className="mt-8 flex flex-col divide-y divide-border border-t border-border">
            {pillars.map((pillar) => (
              <div key={pillar.label} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <dt className="pt-0.5 font-mono text-[0.7rem] uppercase tracking-eyebrow text-primary">
                  {pillar.label}
                </dt>
                <dd>
                  <p className="font-display text-base font-semibold tracking-tight">
                    {pillar.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </Section>
  );
}
