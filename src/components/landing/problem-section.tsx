import { History, KeyRound, Smartphone, TerminalSquare, Unlink, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/utils";

type Problem = {
  icon: LucideIcon;
  title: string;
  body: string;
  trace: string;
};

const problems: Problem[] = [
  {
    icon: Unlink,
    title: "Broken routes",
    body: "Links that 404, redirects that loop, and buttons that quietly go nowhere.",
    trace: "GET /pricing → 404",
  },
  {
    icon: TerminalSquare,
    title: "Invisible console errors",
    body: "Uncaught exceptions that never surface in a manual click-through.",
    trace: "Uncaught TypeError",
  },
  {
    icon: KeyRound,
    title: "Signup & login bugs",
    body: "The one flow that gates revenue, breaking silently on an edge case.",
    trace: "stuck at /login",
  },
  {
    icon: Smartphone,
    title: "Mobile-only failures",
    body: "Layouts and tap targets that work on your machine and nowhere else.",
    trace: "viewport 390×844",
  },
  {
    icon: History,
    title: "Regression bugs",
    body: "Yesterday's fix quietly breaking last week's shipped feature.",
    trace: "diff since v1.4.2",
  },
];

export function ProblemSection() {
  return (
    <Section spacing="lg">
      <Reveal>
        <SectionHeader
          eyebrow="What slips through"
          title="Manual QA can't be everywhere at once."
          description="Every release adds routes, states, and devices no one has time to click through. These are the failures that reach production first."
        />
      </Reveal>

      <Reveal stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem) => (
          <ProblemCard key={problem.title} problem={problem} />
        ))}

        <div className="flex flex-col justify-between rounded-lg border border-primary/25 bg-primary/[0.06] p-6">
          <p className="font-display text-lg font-semibold leading-snug tracking-tight">
            One agent, every route — on every commit.
          </p>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            → explored while you review the PR
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function ProblemCard({ problem }: { problem: Problem }) {
  const Icon = problem.icon;
  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-lg border border-border bg-card p-6",
        "transition-colors hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="font-mono text-[0.7rem] text-muted-foreground/80">{problem.trace}</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{problem.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{problem.body}</p>
    </div>
  );
}
