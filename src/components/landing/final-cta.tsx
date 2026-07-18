import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export function FinalCta() {
  return (
    <Section spacing="lg">
      <Reveal>
        <Card className="relative overflow-hidden bg-card/70">
          <div
            className="grid-lines pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-6 px-6 py-16 text-center md:py-20">
            <span className="eyebrow">Ready when you are</span>
            <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Point it at your staging URL and see what breaks.
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Set a goal, add login details if the flow needs them, and let the agent do the first
              pass — before your users ever hit the bug.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
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
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
