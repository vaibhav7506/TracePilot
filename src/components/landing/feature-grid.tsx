import { AppWindow, Braces, Camera, Network, Sparkles, Terminal, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { Section, SectionHeader } from "@/components/ui/section";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    icon: AppWindow,
    title: "Real browser execution",
    body: "Every run drives an actual Chromium instance — the same engine your users are on, not a simulation.",
  },
  {
    icon: Terminal,
    title: "Console error detection",
    body: "Uncaught exceptions and warnings are captured per step, tied to the exact action that triggered them.",
  },
  {
    icon: Network,
    title: "Network failure detection",
    body: "Failed requests, 500s, and timeouts are logged alongside the flow that depended on them.",
  },
  {
    icon: Camera,
    title: "Screenshot capture",
    body: "A visual record of every step means a failure is never just a stack trace — you see the broken screen.",
  },
  {
    icon: Sparkles,
    title: "AI bug summary",
    body: "The agent explains what broke and why in plain language, ranked by severity, so triage is instant.",
  },
  {
    icon: Braces,
    title: "Playwright export",
    body: "Confirmed flows become clean, runnable Playwright specs you own — no lock-in, no proprietary format.",
  },
];

export function FeatureGrid() {
  return (
    <Section spacing="lg">
      <Reveal>
        <SectionHeader
          eyebrow="Capabilities"
          title="Everything a senior QA engineer would check."
          description="Not a crawler that pings URLs — an agent that acts, observes, and records like a person running the app."
        />
      </Reveal>

      <Reveal stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/50 text-primary transition-colors group-hover:bg-primary/10">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          );
        })}
      </Reveal>
    </Section>
  );
}
