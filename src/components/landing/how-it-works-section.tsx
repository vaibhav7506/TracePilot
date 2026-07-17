import { Bug, Compass, FileCode2, Globe, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { Section, SectionHeader } from "@/components/ui/section";

type Step = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    icon: Globe,
    title: "Enter a URL",
    body: "Give the agent a target and a goal — add login details if the flow needs them.",
  },
  {
    icon: Compass,
    title: "The agent explores",
    body: "It drives a real browser, planning a path through your product like a first-time user.",
  },
  {
    icon: Bug,
    title: "Bugs are captured",
    body: "Broken steps, console errors, and network failures are recorded with screenshots.",
  },
  {
    icon: FileCode2,
    title: "Tests are generated",
    body: "Each verified flow is written out as a Playwright test, ready to drop into CI.",
  },
];

export function HowItWorksSection() {
  return (
    <Section spacing="lg">
      <Reveal>
        <SectionHeader
          eyebrow="How it works"
          title="From a URL to a failing test in one pass."
          description="A single run walks the whole path — no scripts to write, no selectors to maintain."
        />
      </Reveal>

      <Reveal stagger className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const last = index === steps.length - 1;
          return (
            <div key={step.title} className="relative">
              {/* Connector rule between steps on desktop */}
              {!last ? (
                <span
                  className="absolute left-[calc(2.75rem)] right-[-1.5rem] top-5 hidden h-px bg-border lg:block"
                  aria-hidden
                />
              ) : null}

              <div className="flex items-center gap-4">
                <span className="relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          );
        })}
      </Reveal>
    </Section>
  );
}
