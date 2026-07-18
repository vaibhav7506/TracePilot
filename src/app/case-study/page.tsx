import type { Metadata } from "next";
import Link from "next/link";
import { Braces, FileCode2, KeyRound, Radar, Route, ServerCog, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Case study",
  description: "How TracePilot QA turns browser traces into actionable QA reports and tests.",
};

const architecture = [
  { label: "Run request", detail: "A focused URL, goal, and bounded runner policy." },
  { label: "Browser runner", detail: "Playwright executes same-domain, non-destructive actions." },
  { label: "Evidence layer", detail: "Steps, console signals, network failures, and screenshots." },
  { label: "AI gateway", detail: "One validated interface across four optional providers." },
  { label: "Report + tests", detail: "Findings, priorities, and exportable Playwright specs." },
];

const decisions = [
  {
    icon: Route,
    title: "Deterministic core",
    text: "The run remains useful without AI. Browser steps and deterministic findings are persisted first; enrichment is an optional layer.",
  },
  {
    icon: Braces,
    title: "One AI contract",
    text: "OpenAI, Groq, Anthropic, and Gemini adapters return the same internal response shape. Zod validates structured output before product code consumes it.",
  },
  {
    icon: KeyRound,
    title: "Encrypted BYOK",
    text: "User keys are authenticated-encrypted at rest, decrypted only on the server for a provider call, and represented in the UI by a non-secret preview.",
  },
  {
    icon: ShieldCheck,
    title: "Safety boundaries",
    text: "The runner restricts hosts, steps, runtime, and dangerous action text. Credentials and provider keys never enter generated tests or browser context.",
  },
];

const challenges = [
  {
    title: "Useful automation without unsafe autonomy",
    body: "Exploration had to be broad enough to reveal navigation and form failures while staying same-domain and refusing destructive language such as purchase, transfer, or deletion actions.",
  },
  {
    title: "Provider differences without product branching",
    body: "Each API uses different endpoints and response envelopes. The gateway isolates those differences, applies timeouts, sanitizes errors, and validates JSON behind a single interface.",
  },
  {
    title: "A report that proves its claims",
    body: "A finding is more credible when it connects impact, reproduction, browser evidence, console and network signals, a fix direction, and a regression test in one place.",
  },
];

export default function CaseStudyPage() {
  return (
    <>
      <Section className="relative overflow-hidden border-b border-border" spacing="lg">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <Reveal stagger className="relative max-w-4xl">
          <Badge variant="outline">Portfolio case study</Badge>
          <h1 className="mt-7 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            From a browser trace to a test your team can keep.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            TracePilot QA is a portfolio project exploring how a bounded browser agent can make
            first-pass QA faster and more reproducible. It is a QA automation tool, not a security
            scanner or pentesting product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/demo/report">View the demo report</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Start a QA run</Link>
            </Button>
          </div>
        </Reveal>
      </Section>

      <Section spacing="lg">
        <Reveal>
          <SectionHeader
            eyebrow="Problem"
            title="QA evidence is often scattered across tools and memory"
            description="A broken flow can start as a vague report, lose browser context during handoff, and reach engineering without a repeatable test. TracePilot keeps the trace, impact, evidence, and regression artifact connected to the same run."
          />
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Observe", "Drive a real Chromium session through a focused user journey."],
            ["Explain", "Turn raw browser signals into prioritized, reproducible findings."],
            ["Codify", "Export readable Playwright tests with deterministic fallback."],
          ].map(([title, text], index) => (
            <Reveal key={title} delay={index * 0.06}>
              <Card className="h-full bg-card/65">
                <CardHeader>
                  <span className="font-mono text-xs text-primary">0{index + 1}</span>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {text}
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-y border-border bg-muted/20" spacing="lg">
        <Reveal>
          <SectionHeader
            eyebrow="Architecture"
            title="A bounded pipeline with durable evidence"
            description="The architecture separates deterministic execution from optional intelligence, so provider availability never decides whether the core QA run works."
          />
        </Reveal>
        <ol className="mt-8 grid gap-3 lg:grid-cols-5">
          {architecture.map((item, index) => (
            <li key={item.label} className="relative">
              <Card className="h-full bg-background/70">
                <CardContent className="p-5">
                  <span className="font-mono text-[0.68rem] text-primary">STEP {index + 1}</span>
                  <h3 className="mt-3 font-display text-base font-semibold">{item.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section spacing="lg">
        <Reveal>
          <SectionHeader
            eyebrow="Engineering decisions"
            title="Reliability and security shape the product"
            description="The browser agent, AI layer, and export path share one rule: untrusted input stays constrained and secrets stay server-side."
          />
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {decisions.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 0.05}>
              <Card className="h-full transition-colors hover:border-primary/35">
                <CardContent className="flex gap-4 p-6">
                  <span className="h-fit rounded-md border border-primary/25 bg-primary/10 p-2.5 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-y border-border bg-card/35" spacing="lg">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">Browser agent workflow</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              Test, capture, analyze, generate
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Playwright handles navigation and observation. The report timeline preserves every
              successful and failed action. Findings group the evidence by severity, then the test
              generator uses both the trace and analysis to produce realistic specs.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Radar,
                  title: "Runner",
                  text: "Same-domain exploration, form validation, console and network capture.",
                },
                {
                  icon: ServerCog,
                  title: "Gateway",
                  text: "Provider registry, unified responses, timeout handling, and safe failures.",
                },
                {
                  icon: FileCode2,
                  title: "Test generation",
                  text: "Smoke, navigation, forms, auth, and finding-specific regression coverage.",
                },
                {
                  icon: ShieldCheck,
                  title: "Report",
                  text: "Impact, reproduction, evidence, signals, risk, and next actions.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <Card key={title} className="bg-background/65">
                  <CardContent className="p-5">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                    <h3 className="mt-4 font-display font-semibold">{title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section spacing="lg">
        <Reveal>
          <SectionHeader
            eyebrow="Technical challenges"
            title="The hard parts were the boundaries"
            description="The implementation work centered on making each layer honest about what it knows, what it can safely do, and how it fails."
          />
        </Reveal>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {challenges.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <article className="grid gap-3 py-6 md:grid-cols-[0.8fr_1.2fr] md:gap-10">
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border" spacing="lg">
        <Reveal>
          <Card className="overflow-hidden bg-card/70">
            <CardContent className="grid gap-8 p-7 md:grid-cols-2 md:p-10">
              <div>
                <span className="eyebrow">Deployment considerations</span>
                <h2 className="mt-3 font-display text-2xl font-semibold">
                  Run browsers where they can finish
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Chromium execution belongs on a long-running Node server or worker with explicit
                  CPU, memory, and timeout controls. A short-timeout serverless request is not a
                  reliable execution environment for full browser runs.
                </p>
              </div>
              <div>
                <span className="eyebrow">Future improvements</span>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>• Dedicated job queue and isolated browser workers.</li>
                  <li>• Encrypted run credentials backed by a managed secret store.</li>
                  <li>• Collaboration, scheduled runs, and change-aware test selection.</li>
                  <li>• Deeper accessibility coverage with explainable evidence.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </Section>
    </>
  );
}
