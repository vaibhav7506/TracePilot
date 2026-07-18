import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { AgentHero } from "@/components/hero/agent-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const capabilities = ["Real Chromium", "Structured traces", "Playwright export"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div className="container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Reveal stagger className="flex min-w-0 w-full flex-col items-start">
          <Badge variant="outline" className="mb-7">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            AI browser QA agent
          </Badge>

          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.03] tracking-tight sm:text-5xl md:text-6xl">
            Catch the <span className="text-primary">broken flow</span>
            <br className="hidden sm:block" /> before your users do.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            TracePilot QA explores the journeys that matter, records what actually happened, and
            turns verified failures into reports and Playwright regression tests your team can use.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Start a QA Run</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/demo/report">View Demo Report</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/case-study">Read Case Study</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6">
            {capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
                {cap}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.12} className="relative min-w-0 w-full">
          <Card className="relative overflow-hidden bg-card/60">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                agent://exploring
              </span>
            </div>
            <div className="h-[320px] w-full sm:h-[420px]">
              <AgentHero className="h-full w-full" />
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 font-mono text-[0.7rem] text-muted-foreground">
              <span>node /checkout → /payment</span>
              <span className="text-primary">assert failed · 5s</span>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
